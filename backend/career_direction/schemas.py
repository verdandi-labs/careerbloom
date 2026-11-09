from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

MIN_SUMMARY_LENGTH = 20
MAX_SUMMARY_LENGTH = 500


class CareerDirectionCreate(BaseModel):
    summary: str

    @field_validator("summary")
    @classmethod
    def validate_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < MIN_SUMMARY_LENGTH:
            raise ValueError(
                f"Summary must be at least {MIN_SUMMARY_LENGTH} characters"
            )
        if len(v) > MAX_SUMMARY_LENGTH:
            raise ValueError(f"Summary must be at most {MAX_SUMMARY_LENGTH} characters")
        return v


class CareerDirectionResponse(BaseModel):
    career_direction_id: UUID
    summary: str
    created_at: datetime

    model_config = {"from_attributes": True}
