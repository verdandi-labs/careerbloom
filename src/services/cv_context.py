from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from cv.repository import CvRepository
from cv.schemas import CvData


async def build_cv_context(user_id: UUID, db: AsyncSession) -> CvData:
    repo = CvRepository(db)
    full_cv = await repo.get_current_cv(user_id)
    if not full_cv.has_content():
        return full_cv
    needed = {"headline", "self_summary", "experience", "skills", "tech_stack"}
    filtered = {
        field: (getattr(full_cv, field) if field in needed else None)
        for field in CvData.model_fields
    }
    return CvData(**filtered)
