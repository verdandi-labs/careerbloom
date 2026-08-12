from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

MIN_TRANSITION_LENGTH = 20
MAX_TRANSITION_LENGTH = 500


class TransitionCreate(BaseModel):
    transition: str

    @field_validator("transition")
    @classmethod
    def validate_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < MIN_TRANSITION_LENGTH:
            raise ValueError(f"Transition must be at least {MIN_TRANSITION_LENGTH} characters")
        if len(v) > MAX_TRANSITION_LENGTH:
            raise ValueError(f"Transition must be at most {MAX_TRANSITION_LENGTH} characters")
        return v


class TransitionResponse(BaseModel):
    transition_id: UUID
    transition: str
    created_at: datetime

    model_config = {"from_attributes": True}