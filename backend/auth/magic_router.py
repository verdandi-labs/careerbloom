from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from auth.magic_link import generate_magic_token, send_magic_link
from auth.service import create_session, create_user
from database import get_db
from shared.crypto import hash_email, hash_token
from shared.models.user import MagicLinkToken, User
from config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()
SESSION_COOKIE = "session"


class MagicLinkRequest(BaseModel):
    email: EmailStr


@router.post("/magic-link")
async def request_magic_link(request: MagicLinkRequest, db: AsyncSession = Depends(get_db)):
    email_hash = hash_email(request.email)
    result = await db.execute(select(User).where(User.email_hash == email_hash))
    user = result.scalar_one_or_none()
    flow = "returning" if user else "new"

    token = generate_magic_token()
    db.add(
        MagicLinkToken(
            email_hash=email_hash,
            token_hash=hash_token(token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
    )
    await db.commit()
    await send_magic_link(request.email, token, settings.FRONTEND_URL, flow=flow)

    return {"message": "Check your email for magic link"}


@router.get("/magic")
async def verify_magic_link(
    request: Request,
    token: str = Query(...),
    email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    token_hash_value = hash_token(token)
    result = await db.execute(select(MagicLinkToken).where(MagicLinkToken.token_hash == token_hash_value))
    magic_token = result.scalar_one_or_none()
    if not magic_token:
        raise HTTPException(status_code=400, detail="Invalid link")
    if magic_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expired")

    email_hash = hash_email(email)
    result = await db.execute(select(User).where(User.email_hash == email_hash))
    user = result.scalar_one_or_none()
    if not user:
        user = await create_user(db, "magic_link", email=email)

    await db.execute(delete(MagicLinkToken).where(MagicLinkToken.token_id == magic_token.token_id))

    raw_session = await create_session(db, user.user_id)
    await db.commit()

    response = JSONResponse(content={"onboarding": user.onboarding})
    response.set_cookie(
        SESSION_COOKIE,
        raw_session,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    return response
