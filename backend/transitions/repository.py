from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models.transitions import Transition

MAX_TRANSITIONS = 4


class TransitionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: UUID) -> list[Transition]:
        result = await self.db.execute(
            select(Transition)
            .where(Transition.user_id == user_id)
            .order_by(Transition.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest(self, user_id: UUID) -> Transition | None:
        result = await self.db.execute(
            select(Transition)
            .where(Transition.user_id == user_id)
            .order_by(Transition.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID, transition_id: UUID) -> Transition | None:
        result = await self.db.execute(
            select(Transition).where(
                Transition.transition_id == transition_id,
                Transition.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_or_rotate(self, user_id: UUID, encrypted: str) -> Transition:
        count = await self.db.execute(
            select(func.count(Transition.transition_id)).where(Transition.user_id == user_id)
        )
        if count.scalar_one() >= MAX_TRANSITIONS:
            result = await self.db.execute(
                select(Transition)
                .where(Transition.user_id == user_id)
                .order_by(Transition.created_at.asc())
                .limit(1)
            )
            oldest = result.scalar_one()
            oldest.transition = encrypted
            oldest.created_at = func.now()
            await self.db.flush()
            return oldest
        transition = Transition(user_id=user_id, transition=encrypted)
        self.db.add(transition)
        await self.db.flush()
        return transition

    async def delete(self, user_id: UUID, transition_id: UUID) -> bool:
        transition = await self.get_by_id(user_id, transition_id)
        if not transition:
            return False
        await self.db.delete(transition)
        await self.db.flush()
        return True