import json
import logging
from collections.abc import AsyncIterator
from uuid import UUID

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from sqlalchemy.ext.asyncio import AsyncSession

from chat.repository import ChatRepository
from cv.repository import CvRepository
from cv.schemas import CvData
from graph.nodes import FALLBACK_STATUS_EVENT
from graph.state import CareerBloomState
from llm.cloudflare import CloudflareClient
from services.streaming import StreamEvent
from workflows.cv_chat import cv_chat_graph

logger = logging.getLogger(__name__)

CV_UPLOAD_PROMPT = (
    "I don't see a CV on file yet. Could you please upload your CV "
    "so I can help you with this?"
)


async def _classify_sections(user_id: str, message: str, db: AsyncSession) -> list[str]:
    prompt = [
        HumanMessage(
            content=(
                "Given this message, which CV sections are relevant? "
                "Reply with only a JSON array from: "
                '[ "experience", "skills", "tech_stack", '
                '"education", "languages", "awards", "publications", '
                '"volunteering", "projects"]\n\n'
                f"Message: {message}"
            )
        )
    ]
    client = CloudflareClient()
    result = await client.generate(
        prompt, user_id=user_id, db=db, bypass_limits=True, register=False
    )
    text = result.text.strip()
    if text.startswith("["):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
    return []


async def _build_cv_data(user_id: UUID, message: str, db: AsyncSession) -> CvData:
    repo = CvRepository(db)
    full_cv = await repo.get_current_cv(user_id)
    if not full_cv.has_content():
        return full_cv
    sections = await _classify_sections(str(user_id), message, db)
    needed = {"headline", "self_summary"} | set(sections)
    filtered = {
        field: (getattr(full_cv, field) if field in needed else None)
        for field in CvData.model_fields
    }
    return CvData(**filtered)


async def stream_cv_chat(
    user_id: UUID,
    conversation_id: UUID | None,
    message: str,
    selected_model: str | None,
    db: AsyncSession,
) -> AsyncIterator[StreamEvent]:
    chat_repo = ChatRepository(db)
    conversation = await chat_repo.get_or_create_conversation(
        user_id, feature="cv_chat", conversation_id=conversation_id
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

    cv_data = await _build_cv_data(user_id, message, db)

    if not cv_data.has_content():
        await chat_repo.add_message(
            user_id, conversation.id, "assistant", CV_UPLOAD_PROMPT
        )
        yield StreamEvent(kind="token", text=CV_UPLOAD_PROMPT)
        return

    state = CareerBloomState(
        user_id=str(user_id),
        cv_data=cv_data,
        message_history=message_history,
        response="",
        tokens_used=0,
        model_name="",
        job_description=None,
        job_title=None,
        company_name=None,
        application_intent=None,
        career_context=None,
        retry_count=0,
    )

    config = RunnableConfig(configurable={"db": db, "selected_model": selected_model})

    full_response = ""

    async for event in cv_chat_graph.astream_events(state, config=config, version="v2"):
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
        await chat_repo.add_message(
            user_id, conversation.id, "assistant", full_response
        )
