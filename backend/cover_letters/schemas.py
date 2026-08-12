from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class CoverLetterGenerateRequest(BaseModel):
    job_title: str
    company: str
    job_description: str
    context: str | None = None
    language: str
    name: str | None = None

    @field_validator("job_title", "company", "job_description", "context", "name")
    @classmethod
    def clean(cls, v: str | None) -> str | None:
        return v.strip() or None if v else None


class CoverLetterResponse(BaseModel):
    letter_id: UUID
    name: str | None
    language: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}