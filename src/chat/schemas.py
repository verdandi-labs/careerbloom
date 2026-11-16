from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from cv.schemas import TEXT_FIELDS


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    feature: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str = Field(..., max_length=10_000)
    selected_model: str | None = None
    job_title: str | None = None
    company_name: str | None = None


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    suggestion: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CoverLetterSuggestion(BaseModel):
    type: Literal["cover_letter"]
    text: str = Field(..., max_length=5000)


class CvRowSuggestion(BaseModel):
    type: Literal["row_suggestion"]
    section: str
    line_num: int | None = None
    fields: dict[str, str]


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
