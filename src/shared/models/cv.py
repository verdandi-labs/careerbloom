from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID

from database import Base

CV_FIELDS = [
    "full_name",
    "headline",
    "self_summary",
    "contact_details",
    "experience",
    "skills",
    "tech_stack",
    "education",
    "awards",
    "publications",
    "volunteering",
    "projects",
    "languages",
]


class CvUpload(Base):
    __tablename__ = "cv_upload"

    upload_id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    full_name = Column(Text)
    headline = Column(Text)
    self_summary = Column(Text)
    contact_details = Column(JSONB)
    experience = Column(JSONB)
    skills = Column(JSONB)
    tech_stack = Column(JSONB)
    education = Column(JSONB)
    awards = Column(JSONB)
    publications = Column(JSONB)
    volunteering = Column(JSONB)
    projects = Column(JSONB)
    languages = Column(JSONB)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class CvEdit(Base):
    __tablename__ = "cv_edit"

    edit_id = Column(UUID, primary_key=True, default=uuid4)
    upload_id = Column(
        UUID, ForeignKey("cv_upload.upload_id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    full_name = Column(Text)
    headline = Column(Text)
    self_summary = Column(Text)
    contact_details = Column(JSONB)
    experience = Column(JSONB)
    skills = Column(JSONB)
    tech_stack = Column(JSONB)
    education = Column(JSONB)
    awards = Column(JSONB)
    publications = Column(JSONB)
    volunteering = Column(JSONB)
    projects = Column(JSONB)
    languages = Column(JSONB)
    edit_date = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class CvSavedVersion(Base):
    __tablename__ = "cv_saved_versions"

    version_id = Column(UUID, primary_key=True, default=uuid4)
    user_id = Column(
        UUID, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    cv_name = Column(Text, nullable=False)
    full_name = Column(Text)
    headline = Column(Text)
    self_summary = Column(Text)
    contact_details = Column(JSONB)
    experience = Column(JSONB)
    skills = Column(JSONB)
    tech_stack = Column(JSONB)
    education = Column(JSONB)
    awards = Column(JSONB)
    publications = Column(JSONB)
    volunteering = Column(JSONB)
    projects = Column(JSONB)
    languages = Column(JSONB)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
