from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.service import SESSION_TTL_DAYS, create_session
from database import get_db
from shared.crypto import hash_token
from shared.models.user import Session as SessionRow
from shared.models.user import User

SESSION_COOKIE = "session"


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

    result = await db.execute(
        select(SessionRow).where(SessionRow.token_hash == hash_token(raw_token))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        )
    if session.expires_at < datetime.now(UTC):
        await db.execute(
            delete(SessionRow).where(SessionRow.session_id == session.session_id)
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired"
        )

    result = await db.execute(select(User).where(User.user_id == session.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    new_raw = await create_session(db, user.user_id)
    await db.execute(
        delete(SessionRow).where(SessionRow.session_id == session.session_id)
    )
    response.set_cookie(
        SESSION_COOKIE,
        new_raw,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
    )
    request.state.session_refresh_cookie = new_raw
    return user


def rotated_session_headers(request: Request) -> dict[str, str]:
    raw = getattr(request.state, "session_refresh_cookie", None)
    if not raw:
        return {}
    return {
        "Set-Cookie": (
            f"{SESSION_COOKIE}={raw}; httponly; secure; samesite=lax; "
            f"max-age={SESSION_TTL_DAYS * 24 * 60 * 60}; path=/"
        )
    }


async def get_db_for_current_user(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AsyncSession:
    return db
