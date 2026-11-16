import logging
from collections.abc import AsyncIterator
from uuid import UUID

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from sqlalchemy.ext.asyncio import AsyncSession

from career_direction.repository import CareerDirectionRepository
from chat.repository import ChatRepository
from chat.service import parse_suggestion
from graph.nodes import FALLBACK_STATUS_EVENT
from graph.state import CareerBloomState
from services.cv_context import build_cv_context
from services.streaming import StreamEvent
from workflows.job_compatibility import job_compatibility_graph

logger = logging.getLogger(__name__)

CV_UPLOAD_PROMPT = (
    "I don't see a CV on file yet. Could you please upload your CV "
    "so I can help you in a better way?"
)


async def _fetch_career_context(user_id: UUID, db: AsyncSession) -> str | None:
    try:
        repo = CareerDirectionRepository(db)
        latest = await repo.get_latest(user_id)
        if not latest:
            return None
        return latest.summary
    except Exception:
        logger.exception("Failed to load career direction context")
        return None


async def stream_job_compatibility(
    user_id: UUID,
    conversation_id: UUID | None,
    message: str,
    job_title: str | None,
    company_name: str | None,
    selected_model: str | None,
    db: AsyncSession,
) -> AsyncIterator[StreamEvent]:
    chat_repo = ChatRepository(db)
    conversation = await chat_repo.get_or_create_conversation(
        user_id, feature="job_compatibility", conversation_id=conversation_id
    )
    messages = await chat_repo.get_messages(user_id, conversation.id)
    message_history = [
        HumanMessage(content=m.content)
        if m.role == "user"
        else AIMessage(content=m.content)
        for m in messages
    ]
    message_history.append(HumanMessage(content=message))
    await chat_repo.add_message(user_id, conversation.id, "user", message)

    cv_data = await build_cv_context(user_id, db)

    if not cv_data.has_content():
        await chat_repo.add_message(
            user_id, conversation.id, "assistant", CV_UPLOAD_PROMPT
        )
        yield StreamEvent(kind="token", text=CV_UPLOAD_PROMPT)
        return

    career_context = await _fetch_career_context(user_id, db)

    state = CareerBloomState(
        user_id=str(user_id),
        feature="job_compatibility",
        cv_data=cv_data,
        message_history=message_history,
        response="",
        tokens_used=0,
        model_name="",
        job_description=None,
        job_title=job_title,
        company_name=company_name,
        application_intent=None,
        career_context=career_context,
        retry_count=0,
    )

    config = RunnableConfig(configurable={"db": db, "selected_model": selected_model})

    full_response = ""

    async for event in job_compatibility_graph.astream_events(
        state, config=config, version="v2"
    ):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"].content
            if chunk:
                full_response += chunk
                yield StreamEvent(kind="token", text=chunk)
        elif (
            event["event"] == "on_custom_event"
            and event["name"] == FALLBACK_STATUS_EVENT
        ):
            yield StreamEvent(kind="status", text=event["data"]["status"])

    if full_response:
        clean, suggestion = parse_suggestion(full_response)
        await chat_repo.add_message(
            user_id, conversation.id, "assistant", clean, suggestion=suggestion
        )
