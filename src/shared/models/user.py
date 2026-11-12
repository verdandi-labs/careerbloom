from uuid import uuid4

from database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID, primary_key=True, default=uuid4)
    encryption_key = Column(Text, nullable=False)
    auth_method = Column(Text, nullable=False)
    provider_id = Column(Text)
    email = Column(Text)
    email_hash = Column(Text, unique=True)
    onboarding = Column(Boolean, nullable=False, default=False)
    key_version = Column(Integer, nullable=False, server_default="1")
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    token_hash = Column(Text, unique=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)
