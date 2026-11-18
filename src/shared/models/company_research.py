from uuid import uuid4

from sqlalchemy import Column, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class CompanyResearch(Base):
    __tablename__ = "company_research"

    id = Column(UUID, primary_key=True, default=uuid4)
    company_name = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
