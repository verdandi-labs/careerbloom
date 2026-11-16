import logging
from collections.abc import AsyncIterator
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from chat.models import ChatConversation
from chat.repository import ChatRepository
from chat.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from services.career_direction import stream_career_direction
from services.cover_letter import stream_cover_letter
from services.cv import stream_cv_chat
from services.job_compatibility import stream_job_compatibility
from services.streaming import SSE_DONE, StreamEvent, sse_frame
from shared.deps import (
    get_current_user,
    get_db_for_current_user,
    rotated_session_headers,
)
from shared.limiter import limiter
from shared.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)

_STREAMERS = {
    "cv_chat": stream_cv_chat,
    "cover_letter": stream_cover_letter,
    "career_direction": stream_career_direction,
    "job_compatibility": stream_job_compatibility,
}
_JOB_CONTEXT_FEATURES = ("cover_letter", "job_compatibility")


def _require_feature(feature: str) -> None:
    if feature not in _STREAMERS:
        raise HTTPException(status_code=404, detail="Unknown feature")


async def _conversation_or_404(
    repo: ChatRepository, user_id: UUID, conversation_id: UUID, feature: str
) -> ChatConversation:
    conversation = await repo.get_conversation(user_id, conversation_id)
    if conversation is None or str(conversation.feature) != feature:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.get("/{feature}/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    feature: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    _require_feature(feature)
    repo = ChatRepository(db)
    conversations = await repo.get_conversations(user.user_id, feature=feature)
    return [ConversationResponse.model_validate(conv) for conv in conversations]


@router.post("/{feature}/conversations", response_model=ConversationResponse)
async def create_conversation(
    feature: str,
    body: ConversationCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    _require_feature(feature)
    repo = ChatRepository(db)
    conversation = await repo.create_conversation(
        user.user_id, feature=feature, title=body.title
    )
    await db.commit()
    return ConversationResponse.model_validate(conversation)


@router.get(
    "/{feature}/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def list_messages(
    feature: str,
    conversation_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    _require_feature(feature)
    repo = ChatRepository(db)
    await _conversation_or_404(repo, user.user_id, conversation_id, feature)
    messages = await repo.get_messages(user.user_id, conversation_id)
    return [MessageResponse.model_validate(message) for message in messages]


@router.post("/{feature}/conversations/{conversation_id}/messages")
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    feature: str,
    conversation_id: UUID,
    body: MessageCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    _require_feature(feature)
    repo = ChatRepository(db)
    await _conversation_or_404(repo, user.user_id, conversation_id, feature)

    async def generate() -> AsyncIterator[str]:
        kwargs: dict = {
            "user_id": user.user_id,
            "conversation_id": conversation_id,
            "message": body.content,
            "selected_model": None,
            "db": db,
        }
        if feature in _JOB_CONTEXT_FEATURES:
            kwargs["job_title"] = None
            kwargs["company_name"] = None
        try:
            async for event in _STREAMERS[feature](**kwargs):
                yield sse_frame(event)
            await db.commit()
        except Exception:
            logger.exception("Chat stream failed")
            yield sse_frame(
                StreamEvent(
                    kind="error",
                    text="Message could not be sent, please try again",
                )
            )
            return
        yield f"data: {SSE_DONE}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers=rotated_session_headers(request),
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = ChatRepository(db)
    conversation = await repo.get_conversation(user.user_id, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if str(conversation.feature) == "career_direction":
        raise HTTPException(
            status_code=403,
            detail="Career direction conversations cannot be deleted",
        )
    await repo.delete_conversation(user.user_id, conversation_id)
    await db.commit()


@router.delete("/conversations/{conversation_id}/messages/{message_id}")
async def delete_message(
    conversation_id: UUID,
    message_id: UUID,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = ChatRepository(db)
    deleted = await repo.delete_message(user.user_id, conversation_id, message_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")
    await db.commit()
    return {"ok": True}
