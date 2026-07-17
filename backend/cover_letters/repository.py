from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models.cover_letter import CoverLetter


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
                CoverLetter.id == letter_id,
                CoverLetter.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: UUID, job_title: str, company: str, job_description: str | None = None) -> CoverLetter:
        letter = CoverLetter(
            user_id=user_id,
            job_title=job_title,
            company=company,
            job_description=job_description,
        )
        self.db.add(letter)
        await self.db.flush()
        return letter

    async def update_content(self, user_id: UUID, letter_id: UUID, content_en: str | None = None, content_es: str | None = None) -> CoverLetter | None:
        letter = await self.get_by_id(user_id, letter_id)
        if not letter:
            return None
        if content_en is not None:
            letter.content_en = content_en
        if content_es is not None:
            letter.content_es = content_es
        await self.db.flush()
        return letter

    async def delete(self, user_id: UUID, letter_id: UUID) -> bool:
        letter = await self.get_by_id(user_id, letter_id)
        if not letter:
            return False
        await self.db.delete(letter)
        await self.db.flush()
        return True
