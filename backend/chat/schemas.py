from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime

from cv.schemas import TEXT_FIELDS


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    is_career_direction: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str = Field(..., max_length=10_000)


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    suggestion: dict | None = None
    applied_text: str | None = None
    rejected: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    messages: list[dict[str, str]]
    cv_text: str | None = None


class ChatSuggestion(BaseModel):
    type: str
    section: str
    original: str
    options: list[str]

    @field_validator("type")
    @classmethod
    def _type_must_be_suggestion(cls, v: str) -> str:
        if v != "suggestion":
            raise ValueError("type must be 'suggestion'")
        return v

    @field_validator("section")
    @classmethod
    def _section_must_be_text_field(cls, v: str) -> str:
        if v not in TEXT_FIELDS:
            raise ValueError("section must be a text field")
        return v

    @field_validator("original")
    @classmethod
    def _original_length(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("original too long")
        return v

    @field_validator("options")
    @classmethod
    def _options_valid(cls, v: list[str]) -> list[str]:
        if not v or len(v) > 5:
            raise ValueError("options must have 1-5 items")
        for o in v:
            if not o.strip() or len(o) > 2000:
                raise ValueError("invalid option")
        return v
