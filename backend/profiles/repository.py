from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models.profile import Profile


class ProfileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: UUID) -> Profile | None:
        result = await self.db.execute(select(Profile).where(Profile.id == user_id))
        return result.scalar_one_or_none()

    async def update(self, user_id: UUID, **kwargs) -> Profile | None:
        profile = await self.get_by_id(user_id)
        if not profile:
            return None
        for key, value in kwargs.items():
            if value is not None and hasattr(profile, key):
                setattr(profile, key, value)
        await self.db.flush()
        return profile
