from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from shared.models.cv import CvContent, CvUpload
from shared.models.profile import Profile


class CvRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_sections(self, user_id: UUID) -> list[CvContent]:
        result = await self.db.execute(
            select(CvContent).where(CvContent.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_section(self, user_id: UUID, section: str) -> CvContent | None:
        result = await self.db.execute(
            select(CvContent).where(
                CvContent.user_id == user_id,
                CvContent.section == section,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_section(
        self, user_id: UUID, section: str, content_en: str | None = None, content_es: str | None = None
    ) -> CvContent:
        stmt = pg_insert(CvContent).values(
            user_id=user_id,
            section=section,
            content_en=content_en or "",
            content_es=content_es or "",
        )
        stmt = stmt.on_conflict_do_update(
            constraint="cv_content_user_section_key",
            set_={
                **({"content_en": content_en} if content_en is not None else {}),
                **({"content_es": content_es} if content_es is not None else {}),
            },
        )
        await self.db.execute(stmt)
        await self.db.flush()
        return await self.get_section(user_id, section)

    async def get_latest_upload(self, user_id: UUID) -> CvUpload | None:
        result = await self.db.execute(
            select(CvUpload)
            .where(CvUpload.user_id == user_id)
            .order_by(CvUpload.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_upload(self, user_id: UUID, file_url: str, file_name: str | None, extracted_text: str | None) -> CvUpload:
        upload = CvUpload(
            user_id=user_id,
            file_url=file_url,
            file_name=file_name,
            extracted_text=extracted_text,
        )
        self.db.add(upload)
        await self.db.flush()
        return upload
