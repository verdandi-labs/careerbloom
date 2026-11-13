import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from database import Base

ConversationFeature = Enum(
    "cv_chat",
    "cover_letter",
    "career_direction",
    "job_compatibility",
    name="conversation_feature",
)


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    title = Column(Text, nullable=False, server_default="New conversation")
    feature = Column(ConversationFeature, nullable=False, server_default="cv_chat")
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant')", name="chat_messages_role_check"
        ),
        Index("chat_messages_conversation_idx", "conversation_id", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    role = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    suggestion = Column(JSONB)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
