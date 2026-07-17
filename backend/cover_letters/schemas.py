from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CoverLetterCreate(BaseModel):
    job_title: str
    company: str
    job_description: str | None = None


class CoverLetterResponse(BaseModel):
    id: UUID
    job_title: str
    company: str
    job_description: str | None
    content_en: str
    content_es: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CoverLetterGenerateRequest(BaseModel):
    cv_text: str | None = None


class CoverLetterExportPdfRequest(BaseModel):
    job_title: str
    company: str
    content: str
