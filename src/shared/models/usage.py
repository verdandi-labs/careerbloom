from sqlalchemy import Column, Date, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Usage(Base):
    __tablename__ = "usage"
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="usage_user_date_unique"),
        Index("idx_usage_user_date", "user_id", "date"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    date = Column(Date, nullable=False)
    request_count = Column(Integer, nullable=False, server_default="0")
    tokens_used = Column(Integer, nullable=False, server_default="0")
