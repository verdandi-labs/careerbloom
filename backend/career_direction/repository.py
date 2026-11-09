from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models.career_direction import CareerDirection

MAX_CAREER_DIRECTIONS = 4


class CareerDirectionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: UUID) -> list[CareerDirection]:
        result = await self.db.execute(
            select(CareerDirection)
            .where(CareerDirection.user_id == user_id)
            .order_by(CareerDirection.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest(self, user_id: UUID) -> CareerDirection | None:
        result = await self.db.execute(
            select(CareerDirection)
            .where(CareerDirection.user_id == user_id)
            .order_by(CareerDirection.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id(
        self, user_id: UUID, career_direction_id: UUID
    ) -> CareerDirection | None:
        result = await self.db.execute(
            select(CareerDirection).where(
                CareerDirection.career_direction_id == career_direction_id,
                CareerDirection.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_or_rotate(self, user_id: UUID, encrypted: str) -> CareerDirection:
        count = await self.db.execute(
            select(func.count(CareerDirection.career_direction_id)).where(
                CareerDirection.user_id == user_id
            )
        )
        if count.scalar_one() >= MAX_CAREER_DIRECTIONS:
            result = await self.db.execute(
                select(CareerDirection)
                .where(CareerDirection.user_id == user_id)
                .order_by(CareerDirection.created_at.asc())
                .limit(1)
            )
            oldest = result.scalar_one()
            oldest.summary = encrypted
            oldest.created_at = func.now()
            await self.db.flush()
            return oldest
        career_direction = CareerDirection(user_id=user_id, summary=encrypted)
        self.db.add(career_direction)
        await self.db.flush()
        return career_direction

    async def delete(self, user_id: UUID, career_direction_id: UUID) -> bool:
        career_direction = await self.get_by_id(user_id, career_direction_id)
        if not career_direction:
            return False
        await self.db.delete(career_direction)
        await self.db.flush()
        return True
