from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from database import get_db
from shared.models.user import User
from auth.magic_link import generate_magic_token, send_magic_link, hash_password, verify_password
from auth.router import create_access_token
from config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class MagicLinkRequest(BaseModel):
    email: EmailStr


class PasswordRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class ByodbRequest(BaseModel):
    email: EmailStr
    database_url: str


@router.post("/magic-link")
async def request_magic_link(request: MagicLinkRequest):
    async with get_db() as db:
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()

        if not user:
            user = User(email=request.email)
            db.add(user)

        token = generate_magic_token()
        user.magic_token = token
        user.magic_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)

        await db.commit()

        await send_magic_link(request.email, token, settings.FRONTEND_URL)

        return {"message": "Check your email for magic link", "email": request.email}


@router.get("/magic")
async def verify_magic_link(token: str = Query(...), email: str = Query(...)):
    async with get_db() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user or user.magic_token != token:
            raise HTTPException(status_code=400, detail="Invalid link")

        if user.magic_token_expires is None or user.magic_token_expires < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Link expired")

        user.magic_token = None
        user.magic_token_expires = None
        await db.commit()

        return {"message": "Link valid", "email": email}


@router.post("/password")
async def set_password(request: PasswordRequest):
    async with get_db() as db:
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        user.password_hash = hash_password(request.password)
        await db.commit()

        access_token = create_access_token(str(user.id))
        return {"message": "Password set", "email": request.email, "access_token": access_token}


@router.post("/login")
async def login_with_password(request: PasswordRequest):
    async with get_db() as db:
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()

        if not user or not user.password_hash or not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid email or password")

        access_token = create_access_token(str(user.id))
        return {
            "message": "Logged in",
            "email": user.email,
            "access_token": access_token,
            "has_database_url": user.database_url is not None,
        }


@router.post("/byodb")
async def save_byodb(request: ByodbRequest):
    async with get_db() as db:
        result = await db.execute(select(User).where(User.email == request.email))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        user.database_url = request.database_url
        await db.commit()

        return {"message": "Database URL saved", "email": user.email}


@router.get("/skip-byodb")
async def skip_byodb(email: str = Query(...)):
    async with get_db() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        return {"message": "Using shared database", "email": email}
