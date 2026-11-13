from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models.applications import Application

DUPLICATE_WINDOW_DAYS = 14


class ApplicationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_if_not_duplicate(
        self,
        user_id: UUID,
        job_title: str | None,
        company_name: str | None,
        job_description: str | None,
    ) -> Application | None:
        cutoff = datetime.now(UTC) - timedelta(days=DUPLICATE_WINDOW_DAYS)
        result = await self.db.execute(
            select(Application).where(
                Application.user_id == user_id,
                Application.job_title == job_title,
                Application.company_name == company_name,
                Application.created_at >= cutoff,
            )
        )
        if result.scalar_one_or_none():
            return None
        application = Application(
            user_id=user_id,
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
        )
        self.db.add(application)
        await self.db.flush()
        return application
