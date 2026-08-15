from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


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
