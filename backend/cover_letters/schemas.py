from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class CoverLetterGenerateRequest(BaseModel):
    job_title: str = Field(..., max_length=200)
    company: str = Field(..., max_length=200)
    job_description: str | None = Field(None, max_length=5_000)
    context: str | None = None
    name: str | None = Field(None, max_length=200)

    @field_validator("job_title", "company", "job_description", "context", "name")
    @classmethod
    def clean(cls, v: str | None) -> str | None:
        return v.strip() or None if v else None


class SaveCoverLetterRequest(BaseModel):
    text: str = Field(..., max_length=10000)
    name: str | None = Field(None, max_length=200)


class CoverLetterResponse(BaseModel):
    letter_id: UUID
    name: str | None
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
