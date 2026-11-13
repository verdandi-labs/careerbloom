from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from chat.models import ChatConversation, ChatMessage


class ChatRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_conversations(
        self, user_id: UUID, feature: str | None = None
    ) -> list[ChatConversation]:
        query = select(ChatConversation).where(ChatConversation.user_id == user_id)
        if feature:
            query = query.where(ChatConversation.feature == feature)
        result = await self.db.execute(
            query.order_by(ChatConversation.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_conversation(
        self, user_id: UUID, conversation_id: UUID
    ) -> ChatConversation | None:
        result = await self.db.execute(
            select(ChatConversation).where(
                ChatConversation.id == conversation_id,
                ChatConversation.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_conversation(
        self,
        user_id: UUID,
        feature: str,
        title: str | None = None,
    ) -> ChatConversation:
        conv = ChatConversation(
            user_id=user_id,
            feature=feature,
            title=title or f"Conversation - {datetime.now(UTC).strftime('%b %d, %Y')}",
        )
        self.db.add(conv)
        await self.db.flush()
        return conv

    async def get_or_create_conversation(
        self,
        user_id: UUID,
        feature: str,
        conversation_id: UUID | None = None,
    ) -> ChatConversation:
        if conversation_id:
            existing = await self.get_conversation(user_id, conversation_id)
            if existing:
                return existing
        conv = await self.create_conversation(user_id, feature)
        return conv

    async def get_messages(
        self, user_id: UUID, conversation_id: UUID
    ) -> list[ChatMessage]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(
                ChatMessage.conversation_id == conversation_id,
                ChatMessage.user_id == user_id,
            )
            .order_by(ChatMessage.created_at)
        )
        return list(result.scalars().all())

    async def get_message(
        self, user_id: UUID, conversation_id: UUID, message_id: UUID
    ) -> ChatMessage | None:
        result = await self.db.execute(
            select(ChatMessage).where(
                ChatMessage.id == message_id,
                ChatMessage.conversation_id == conversation_id,
                ChatMessage.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_message(
        self,
        user_id: UUID,
        conversation_id: UUID,
        role: str,
        content: str,
        suggestion: dict | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            conversation_id=conversation_id,
            user_id=user_id,
            role=role,
            content=content,
            suggestion=suggestion,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg

    async def delete_message(
        self, user_id: UUID, conversation_id: UUID, message_id: UUID
    ) -> bool:
        message = await self.get_message(user_id, conversation_id, message_id)
        if message is None:
            return False
        await self.db.delete(message)
        await self.db.flush()
        return True

    async def delete_conversation(self, user_id: UUID, conversation_id: UUID) -> None:
        conv = await self.get_conversation(user_id, conversation_id)
        if conv is None:
            raise ValueError("not_found")
        await self.db.delete(conv)
        await self.db.flush()
