from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    feature: str
    title: str | None = None


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    feature: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str = Field(..., max_length=10_000)
    conversation_id: UUID | None = None


class MessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    suggestion: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
