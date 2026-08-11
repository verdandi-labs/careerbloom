from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID, primary_key=True, default=uuid4)
    encryption_key = Column(Text, nullable=False)
    auth_method = Column(Text, nullable=False)
    provider_id = Column(Text)
    email = Column(Text)
    email_hash = Column(Text, unique=True)
    onboarding = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MagicLinkToken(Base):
    __tablename__ = "magic_link_tokens"

    token_id = Column(UUID, primary_key=True, default=uuid4)
    email_hash = Column(Text, nullable=False)
    token_hash = Column(Text, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"

    session_id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(UUID, ForeignKey("users.user_id"), nullable=False)
    token_hash = Column(Text, unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
