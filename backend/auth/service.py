import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.crypto import (
    decrypt,
    decrypt_user_key,
    encrypt,
    encrypt_user_key,
    generate_user_key,
    hash_email,
    hash_token,
)
from shared.models.user import Session as SessionRow
from shared.models.user import User

MAGIC_LINK_TTL_MINUTES = 15
SESSION_TTL_DAYS = 7


async def create_user(
    db: AsyncSession,
    auth_method: str,
    provider_id: str | None = None,
    email: str | None = None,
) -> User:
    normalized_email = email.strip().lower() if email else None
    email_hash = hash_email(normalized_email) if normalized_email else None

    if provider_id:
        result = await db.execute(
            select(User).where(User.auth_method == auth_method, User.provider_id == provider_id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    if email_hash:
        result = await db.execute(select(User).where(User.email_hash == email_hash))
        existing = result.scalar_one_or_none()
        if existing:
            if existing.auth_method != auth_method:
                raise ValueError("email_registered_with_different_provider")
            return existing

    user_key = generate_user_key()
    user = User(
        encryption_key=encrypt_user_key(user_key),
        auth_method=auth_method,
        provider_id=provider_id,
        email_hash=email_hash,
        email=encrypt(normalized_email, user_key) if normalized_email else None,
    )
    if auth_method == "magic_link":
        async with db.begin_nested():
            db.add(user)
            await db.flush()
    else:
        db.add(user)
        await db.flush()
    return user


async def create_session(db: AsyncSession, user_id) -> str:
    raw_token = secrets.token_urlsafe(32)
    db.add(
        SessionRow(
            user_id=user_id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS),
        )
    )
    await db.flush()
    return raw_token


async def delete_session(db: AsyncSession, raw_token: str) -> None:
    result = await db.execute(select(SessionRow).where(SessionRow.token_hash == hash_token(raw_token)))
    row = result.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.flush()


def get_user_email(user: User) -> str | None:
    if not user.email:
        return None
    return decrypt(user.email, decrypt_user_key(user.encryption_key))
