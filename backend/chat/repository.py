from uuid import UUID
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from shared.models.chat import ChatConversation, ChatMessage


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_conversations(self, user_id: UUID) -> list[ChatConversation]:
        result = await self.db.execute(
            select(ChatConversation)
            .where(ChatConversation.user_id == user_id)
            .order_by(ChatConversation.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_conversation(self, user_id: UUID, conversation_id: UUID) -> ChatConversation | None:
        result = await self.db.execute(
            select(ChatConversation).where(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_conversation(
        self, user_id: UUID, title: str | None = None, is_career_direction: bool = False
    ) -> ChatConversation:
        conv = ChatConversation(
            user_id=user_id,
            title=title or f"Conversation - {datetime.utcnow().strftime('%b %d, %Y')}",
            is_career_direction=is_career_direction,
        )
        self.db.add(conv)
        await self.db.flush()
        return conv

    async def get_or_create_career_direction(self, user_id: UUID) -> ChatConversation:
        result = await self.db.execute(
            select(ChatConversation).where(
                ChatConversation.user_id == user_id,
                ChatConversation.is_career_direction.is_(True),
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        conv = await self.create_conversation(user_id, "Career Direction", is_career_direction=True)
        opening = "Hi, I'm Bloom \U0001f338 Let's talk about where you want to go \u2014 no pressure, no perfect answers needed.\n\nWhat does your ideal career look like, even if it feels far away right now? What pulls at you, what lights you up?"
        msg = ChatMessage(
            conversation_id=conv.id,
            user_id=user_id,
            role="assistant",
            content=opening,
        )
        self.db.add(msg)
        await self.db.flush()
        return conv

    async def get_messages(self, user_id: UUID, conversation_id: UUID) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(
                ChatMessage.conversation_id == conversation_id,
                ChatMessage.user_id == user_id,
            )
            .order_by(ChatMessage.created_at)
        )
        return list(result.scalars().all())

    async def add_message(
        self, user_id: UUID, conversation_id: UUID, role: str, content: str,
        suggestion: dict | None = None, applied_text: str | None = None
    ) -> ChatMessage:
        msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content,
            suggestion=suggestion,
            applied_text=applied_text,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg
