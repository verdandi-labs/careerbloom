from pydantic import BaseModel, Field, field_validator
from typing import Literal
from uuid import UUID
from datetime import datetime

from cv.schemas import TEXT_FIELDS


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    is_career_direction: bool
    is_cover_letter: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str = Field(..., max_length=10_000)
    context: Literal["cv_chat", "cover_letter", "career_direction"] = "cv_chat"


class ApplySuggestionRequest(BaseModel):
    chosen: str = Field(..., max_length=2000)


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


class CoverLetterSuggestion(BaseModel):
    type: Literal["cover_letter"]
    text: str = Field(..., max_length=5000)


class ChatSuggestion(BaseModel):
    type: str
    section: str
    text: str = Field(..., max_length=2000)

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
