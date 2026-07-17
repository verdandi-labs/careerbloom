import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class CvUpload(Base):
    __tablename__ = "cv_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)
    file_name = Column(Text)
    extracted_text = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class CvEdit(Base):
    __tablename__ = "cv_edits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    original_text = Column(Text, nullable=False)
    approved_text = Column(Text, nullable=False)
    section = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class CvContent(Base):
    __tablename__ = "cv_content"
    __table_args__ = (UniqueConstraint("user_id", "section", name="cv_content_user_section_key"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    section = Column(Text, nullable=False)
    content_en = Column(Text, server_default="")
    content_es = Column(Text, server_default="")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
