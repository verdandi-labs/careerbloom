from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models.cover_letters import CoverLetter

MAX_LETTERS = 4


class CoverLetterRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: UUID) -> list[CoverLetter]:
        result = await self.db.execute(
            select(CoverLetter)
            .where(CoverLetter.user_id == user_id)
            .order_by(CoverLetter.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, user_id: UUID, letter_id: UUID) -> CoverLetter | None:
        result = await self.db.execute(
            select(CoverLetter).where(
                CoverLetter.letter_id == letter_id,
                CoverLetter.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: UUID, name: str | None, text: str) -> CoverLetter:
        letters = await self.get_all(user_id)
        if len(letters) >= MAX_LETTERS:
            oldest = letters[-1]
            await self.db.delete(oldest)
            await self.db.flush()
        letter = CoverLetter(user_id=user_id, name=name, text=text)
        self.db.add(letter)
        await self.db.flush()
        return letter

    async def delete(self, user_id: UUID, letter_id: UUID) -> bool:
        letter = await self.get_by_id(user_id, letter_id)
        if not letter:
            return False
        await self.db.delete(letter)
        await self.db.flush()
        return True
