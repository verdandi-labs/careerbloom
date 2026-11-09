from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Byodb(Base):
    __tablename__ = "byodb"

    user_id = Column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True
    )
    connection = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
