from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from auth.schemas import UserResponse
from auth.service import delete_session, get_user_email
from database import get_db
from shared.deps import SESSION_COOKIE, get_current_user
from shared.models.user import MagicLinkToken, User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse(
        user_id=user.user_id,
        email=get_user_email(user),
        auth_method=user.auth_method,
        onboarding=user.onboarding,
        created_at=user.created_at,
    )


@router.delete("/account")
async def delete_account(
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.email_hash:
        await db.execute(delete(MagicLinkToken).where(MagicLinkToken.email_hash == user.email_hash))
    await db.delete(user)
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db=Depends(get_db),
):
    raw_token = request.cookies.get(SESSION_COOKIE)
    if raw_token:
        await delete_session(db, raw_token)
        response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}
