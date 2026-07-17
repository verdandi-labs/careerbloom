import asyncio
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models.profile import Profile
from config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def hash_password(password: str) -> str:
    return await asyncio.to_thread(pwd_context.hash, password)


async def verify_password(plain: str, hashed: str) -> bool:
    return await asyncio.to_thread(pwd_context.verify, plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return None


async def get_or_create_user(db: AsyncSession, user_id: str, email: str, display_name: str | None = None) -> Profile:
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    if profile:
        return profile

    profile = Profile(
        id=user_id,
        display_name=display_name or email.split("@")[0],
    )
    db.add(profile)
    await db.flush()
    return profile


async def register_user(db: AsyncSession, email: str, password: str, display_name: str | None = None) -> Profile:
    user_id = str(uuid4())
    hashed = await hash_password(password)
    profile = Profile(
        id=user_id,
        display_name=display_name or email.split("@")[0],
    )
    db.add(profile)
    await db.flush()
    return profile


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Profile | None:
    result = await db.execute(select(Profile).where(Profile.email == email))
    profile = result.scalar_one_or_none()
    if profile and profile.hashed_password:
        valid = await verify_password(password, profile.hashed_password)
        if valid:
            return profile
    return None
