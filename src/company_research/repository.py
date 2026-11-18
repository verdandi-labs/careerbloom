from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.models.company_research import CompanyResearch

CACHE_TTL_DAYS = 90


class CompanyResearchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, company_name: str) -> str | None:
        cutoff = datetime.now(UTC) - timedelta(days=CACHE_TTL_DAYS)
        result = await self.db.execute(
            select(CompanyResearch).where(
                func.lower(CompanyResearch.company_name) == company_name.lower(),
                CompanyResearch.created_at >= cutoff,
            )
        )
        row = result.scalar_one_or_none()
        return row.summary if row else None

    async def set(self, company_name: str, summary: str) -> None:
        result = await self.db.execute(
            select(CompanyResearch).where(
                func.lower(CompanyResearch.company_name) == company_name.lower()
            )
        )
        row = result.scalar_one_or_none()
        if row:
            row.summary = summary
            row.created_at = datetime.now(UTC)
        else:
            self.db.add(CompanyResearch(company_name=company_name, summary=summary))
        await self.db.flush()
