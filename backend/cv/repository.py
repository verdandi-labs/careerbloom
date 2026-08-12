from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from cv.schemas import CvData
from shared.models.cv import CV_FIELDS, CvEdit, CvTranslate, CvUpload

MAX_UPLOADS = 4
MAX_EDITS_PER_FIELD = 5
MAX_TRANSLATES = 4


class CvRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def count_uploads(self, user_id: UUID) -> int:
        result = await self.db.execute(select(CvUpload.upload_id).where(CvUpload.user_id == user_id))
        return len(result.scalars().all())

    async def get_latest_upload(self, user_id: UUID) -> CvUpload | None:
        result = await self.db.execute(
            select(CvUpload)
            .where(CvUpload.user_id == user_id)
            .order_by(CvUpload.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_upload(self, user_id: UUID, data: CvData) -> CvUpload:
        result = await self.db.execute(
            select(CvUpload.upload_id)
            .where(CvUpload.user_id == user_id)
            .order_by(CvUpload.created_at.asc())
        )
        existing = result.scalars().all()
        if len(existing) >= MAX_UPLOADS:
            await self.db.execute(delete(CvUpload).where(CvUpload.upload_id == existing[0]))
        row = CvUpload(user_id=user_id, **data.model_dump())
        self.db.add(row)
        await self.db.flush()
        return row

    async def create_edit(self, user_id: UUID, upload_id: UUID, field: str, value) -> CvEdit:
        column = getattr(CvEdit, field)
        result = await self.db.execute(
            select(CvEdit.edit_id)
            .where(CvEdit.user_id == user_id, column.isnot(None))
            .order_by(CvEdit.edit_date.asc())
        )
        existing = result.scalars().all()
        if len(existing) >= MAX_EDITS_PER_FIELD:
            row = await self.db.get(CvEdit, existing[0])
            setattr(row, field, value)
            row.edit_date = datetime.now(timezone.utc)
            return row
        row = CvEdit(user_id=user_id, upload_id=upload_id, **{field: value})
        self.db.add(row)
        await self.db.flush()
        return row

    async def create_translate(self, user_id: UUID, language: str, data: CvData) -> CvTranslate:
        result = await self.db.execute(
            select(CvTranslate.translate_id)
            .where(CvTranslate.user_id == user_id)
            .order_by(CvTranslate.created_at.asc())
        )
        existing = result.scalars().all()
        if len(existing) >= MAX_TRANSLATES:
            row = await self.db.get(CvTranslate, existing[0])
            row.language = language
            for field, value in data.model_dump().items():
                setattr(row, field, value)
            row.created_at = datetime.now(timezone.utc)
            return row
        row = CvTranslate(user_id=user_id, language=language, **data.model_dump())
        self.db.add(row)
        await self.db.flush()
        return row

    async def get_current_cv(self, user_id: UUID) -> CvData:
        upload = await self.get_latest_upload(user_id)
        query = select(CvEdit).where(CvEdit.user_id == user_id)
        if upload is not None:
            query = query.where(CvEdit.edit_date > upload.created_at)
        query = query.order_by(CvEdit.edit_date.asc())
        result = await self.db.execute(query)
        edits = result.scalars().all()

        merged = {}
        for field in CV_FIELDS:
            value = getattr(upload, field) if upload is not None else None
            for edit in edits:
                candidate = getattr(edit, field)
                if candidate is not None:
                    value = candidate
            merged[field] = value
        return CvData(**merged)
