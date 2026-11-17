from sqlalchemy import Boolean, Column, DateTime, Index, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Log(Base):
    __tablename__ = "logs"
    __table_args__ = (
        Index("idx_logs_user_id", "user_id"),
        Index("idx_logs_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    feature = Column(Text, nullable=False)
    duration_ms = Column(Integer, nullable=False)
    suspicious = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
