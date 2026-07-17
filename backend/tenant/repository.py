from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models.tenant import TenantConnection


class TenantRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: UUID) -> TenantConnection | None:
        result = await self.db.execute(
            select(TenantConnection).where(
                TenantConnection.user_id == user_id,
                TenantConnection.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def upsert(self, user_id: UUID, supabase_url: str, db_password_encrypted: str) -> TenantConnection:
        existing = await self.get_by_user(user_id)
        if existing:
            existing.supabase_url = supabase_url
            existing.db_password_encrypted = db_password_encrypted
        else:
            existing = TenantConnection(
                user_id=user_id,
                supabase_url=supabase_url,
                db_password_encrypted=db_password_encrypted,
            )
            self.db.add(existing)
        await self.db.flush()
        return existing

    async def deactivate(self, user_id: UUID) -> None:
        existing = await self.get_by_user(user_id)
        if existing:
            existing.is_active = False
            await self.db.flush()
