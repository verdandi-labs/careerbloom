import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name = Column(Text)
    goal = Column(Text)
    onboarding_complete = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    preferred_language = Column(Text, nullable=False, server_default="en")
    career_direction = Column(Text)
    cv_template = Column(Text, nullable=False, server_default="editorial")
    cv_photo_url = Column(Text)
