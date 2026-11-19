from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.service import SESSION_TTL_DAYS, create_session
from config import get_settings
from database import get_db
from shared.crypto import hash_token
from shared.models.user import Session as SessionRow
from shared.models.user import User

SESSION_COOKIE = "session"
ROTATION_GRACE_SECONDS = 30
settings = get_settings()


async def get_current_user(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    raw_token = request.cookies.get(SESSION_COOKIE)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No session"
        )

    incoming_hash = hash_token(raw_token)

    result = await db.execute(
        select(SessionRow).where(SessionRow.token_hash == incoming_hash)
    )
    session = result.scalar_one_or_none()
    via_grace = False

    if not session:
        grace_cutoff = datetime.now(UTC) - timedelta(seconds=ROTATION_GRACE_SECONDS)
        result = await db.execute(
            select(SessionRow)
            .where(
                SessionRow.previous_token_hash == incoming_hash,
                SessionRow.rotated_at >= grace_cutoff,
            )
            .order_by(SessionRow.rotated_at.desc())
            .limit(1)
        )
        session = result.scalars().first()
        via_grace = True

    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    if session.expires_at < datetime.now(UTC):
        await db.execute(
            delete(SessionRow).where(SessionRow.session_id == session.session_id)
        )
        await db.commit()
        raise HTTPException(status_code=401, detail="Session expired")

    result = await db.execute(select(User).where(User.user_id == session.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not via_grace:
        new_raw = await create_session(
            db,
            user.user_id,
            previous_token_hash=incoming_hash,
        )
        await db.execute(
            delete(SessionRow).where(SessionRow.session_id == session.session_id)
        )
        response.set_cookie(
            SESSION_COOKIE,
            new_raw,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="lax",
            max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        )
        request.state.session_refresh_cookie = new_raw
    return user


def rotated_session_headers(request: Request) -> dict[str, str]:
    raw = getattr(request.state, "session_refresh_cookie", None)
    if not raw:
        return {}
    secure = "" if settings.DEBUG else "; secure"
    return {
        "Set-Cookie": (
            f"{SESSION_COOKIE}={raw}; httponly{secure}; samesite=lax; "
            f"max-age={SESSION_TTL_DAYS * 24 * 60 * 60}; path=/"
        )
    }


async def get_db_for_current_user(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AsyncSession:
    return db
