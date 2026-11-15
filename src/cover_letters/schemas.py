from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SaveCoverLetterRequest(BaseModel):
    text: str = Field(..., max_length=10000)
    name: str | None = Field(None, max_length=200)


class CoverLetterResponse(BaseModel):
    letter_id: UUID
    name: str | None
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
