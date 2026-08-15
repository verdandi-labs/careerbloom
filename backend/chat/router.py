import json
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User
from chat.repository import ChatRepository
from chat.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ChatRequest,
)
from chat.service import parse_suggestion, stream_chat
from cv.service import limiter

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db_for_current_user)):
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
async def get_career_direction(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db_for_current_user)):
    repo = ChatRepository(db)
    conv = await repo.get_or_create_career_direction(user.user_id)
    return ConversationResponse.model_validate(conv)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
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

    await repo.add_message(user.user_id, conversation_id, "user", body.content)

    history = await repo.get_messages(user.user_id, conversation_id)
    messages = [{"role": m.role, "content": m.content} for m in history]

    async def generate():
        full_response = ""
        try:
            for chunk in stream_chat(messages):
                if chunk.text:
                    full_response += chunk.text
                    yield f"data: {json.dumps({'content': chunk.text})}\n\n"
        except Exception:
            logger.error("Chat stream failed", exc_info=True)
            yield f"data: {json.dumps({'error': 'Message could not be sent, please try again'})}\n\n"
        yield "data: [DONE]\n\n"

        clean_content, suggestion = parse_suggestion(full_response)
        await repo.add_message(
            user.user_id, conversation_id, "assistant", clean_content, suggestion=suggestion
        )

    return StreamingResponse(generate(), media_type="text/event-stream")
