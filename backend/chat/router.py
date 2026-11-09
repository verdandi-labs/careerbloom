import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from career_direction.repository import CareerDirectionRepository
from chat.repository import ChatRepository
from chat.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from chat.service import parse_suggestion, stream_chat
from cv.repository import CvRepository
from cv.service import limiter
from shared.crypto import decrypt, decrypt_user_key
from shared.deps import (
    get_current_user,
    get_db_for_current_user,
    rotated_session_headers,
)
from shared.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    convs = await repo.get_conversations(user.user_id)
    return [ConversationResponse.model_validate(c) for c in convs]


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    body: ConversationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    conv = await repo.create_conversation(user.user_id, body.title)
    return ConversationResponse.model_validate(conv)


@router.get("/conversations/career-direction", response_model=ConversationResponse)
async def get_career_direction(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    conv = await repo.get_or_create_career_direction(user.user_id)
    return ConversationResponse.model_validate(conv)


@router.post("/cover-letter-conversations", response_model=ConversationResponse)
async def create_cover_letter_conversation(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    conv = await repo.get_or_create_cover_letter_conversation(user.user_id)
    return ConversationResponse.model_validate(conv)


@router.get("/cover-letter-conversations", response_model=list[ConversationResponse])
async def list_cover_letter_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    convs = await repo.list_cover_letter_conversations(user.user_id)
    return [ConversationResponse.model_validate(c) for c in convs]


@router.get(
    "/conversations/{conversation_id}/messages", response_model=list[MessageResponse]
)
async def list_messages(
    conversation_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    conv = await repo.get_conversation(user.user_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await repo.get_messages(user.user_id, conversation_id)
    return [MessageResponse.model_validate(m) for m in messages]


@router.post("/conversations/{conversation_id}/messages")
@limiter.limit("30/minute")
async def send_message(
    request: Request,
    conversation_id: UUID,
    body: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    conv = await repo.get_conversation(user.user_id, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    cv_text = None
    try:
        cv_data = await CvRepository(db).get_current_cv(user.user_id)
        if any(cv_data.model_dump().values()):
            cv_text = cv_data.model_dump_json()
    except Exception:
        logger.exception("Failed to load CV context for conversation")

    career_direction = None
    try:
        cd_repo = CareerDirectionRepository(db)
        latest_cd = await cd_repo.get_latest(user.user_id)
        if latest_cd:
            user_key = decrypt_user_key(user.encryption_key)
            career_direction = decrypt(latest_cd.summary, user_key)
    except Exception:
        logger.exception("Failed to load career direction context")

    await repo.add_message(user.user_id, conversation_id, "user", body.content)

    history = await repo.get_messages(user.user_id, conversation_id)
    messages = [{"role": m.role, "content": m.content} for m in history]

    async def generate():
        full_response = ""
        try:
            async for chunk in stream_chat(
                messages,
                cv_text,
                career_direction=career_direction,
                context=body.context,
            ):
                if chunk:
                    full_response += chunk
                    yield f"data: {json.dumps({'content': chunk})}\n\n"
        except Exception:
            logger.error("Chat stream failed", exc_info=True)
            yield f"data: {json.dumps({'error': 'Message could not be sent, please try again'})}\n\n"
            return

        try:
            clean_content, suggestion = parse_suggestion(full_response)
            await repo.add_message(
                user.user_id,
                conversation_id,
                "assistant",
                clean_content,
                suggestion=suggestion,
            )
            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception(
                f"post-stream persist failed for conversation {conversation_id}"
            )
            yield f"data: {json.dumps({'error': 'Message could not be sent, please try again'})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers=rotated_session_headers(request),
    )


@router.delete("/conversations/{conversation_id}/messages/{message_id}")
async def delete_message(
    conversation_id: UUID,
    message_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    deleted = await repo.delete_message(user.user_id, conversation_id, message_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True}


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ChatRepository(db)
    conv = await repo.get_conversation(user.user_id, conversation_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.is_career_direction:
        raise HTTPException(
            status_code=403, detail="Career direction conversations cannot be deleted"
        )
    await repo.delete_conversation(user.user_id, conversation_id)
