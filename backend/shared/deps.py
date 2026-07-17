from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, get_db_for_user
from database import router as db_router
from shared.models.profile import Profile
from shared.models.tenant import TenantConnection
from config import get_settings
from tenant.service import decrypt, build_db_url

security = HTTPBearer()
settings = get_settings()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(Profile).where(Profile.id == UUID(user_id)))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return profile


async def get_tenant_db_for_user(user: Profile = Depends(get_current_user)):
    from database import get_db as get_global_db
    async with await get_global_db() as db:
        result = await db.execute(
            select(TenantConnection).where(
                TenantConnection.user_id == user.id,
                TenantConnection.is_active == True,
            )
        )
        tenant = result.scalar_one_or_none()

    if tenant and tenant.db_password_encrypted:
        password = decrypt(tenant.db_password_encrypted)
        db_url = build_db_url(tenant.supabase_url, password)
        async for session in get_db_for_user(db_url)():
            yield session
    else:
        async for session in get_db():
            yield session
