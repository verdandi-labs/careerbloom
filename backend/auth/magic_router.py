from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from shared.models.user import User
from shared.models.profile import Profile
from shared.deps import get_current_user
from auth.magic_link import generate_magic_token, send_magic_link
from auth.router import create_access_token, create_refresh_token
from auth.service import get_or_create_user
from config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


class MagicLinkRequest(BaseModel):
    email: EmailStr
    flow: str = "new"


@router.post("/magic-link")
async def request_magic_link(request: MagicLinkRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalars().first()

    if not user:
        user = User(email=request.email)
        db.add(user)

    token = generate_magic_token()
    user.magic_token = token
    user.magic_token_expires = datetime.now(timezone.utc) + timedelta(minutes=15)

    await db.commit()
    await send_magic_link(request.email, token, settings.FRONTEND_URL, flow=request.flow)

    return {"message": "Check your email for magic link", "email": request.email}


@router.get("/magic")
async def verify_magic_link(token: str = Query(...), email: str = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if not user or user.magic_token != token:
        raise HTTPException(status_code=400, detail="Invalid link")

    if user.magic_token_expires is None or user.magic_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expired")

    user.magic_token = None
    user.magic_token_expires = None
    await db.commit()

    profile = await get_or_create_user(db, str(user.id), user.email)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "has_database_url": user.database_url is not None,
        "onboarding_complete": profile.onboarding_complete,
    }
