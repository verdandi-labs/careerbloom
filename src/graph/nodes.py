import logging
import time
from uuid import UUID

from langchain_core.callbacks import adispatch_custom_event
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from applications.repository import ApplicationRepository
from graph.security import (
    MAX_STRIKES,
    SAFE_RESPONSE_FAILURE,
    STRIKE_BLOCK_MESSAGE,
    build_validated_message,
    check_strike,
    get_strike_message,
    register_strike,
    validate_output,
)
from graph.state import CareerBloomState
from llm.fallback import (
    AllModelsUnavailableError,
    run_with_fallback,
)
from llm.security import LimitExceededError
from prompts.base import GENERAL_TONE

logger = logging.getLogger(__name__)

FALLBACK_STATUS_EVENT = "fallback_status"


async def input_validation_node(
    state: CareerBloomState,
    db: AsyncSession,
) -> dict:
    user_id = state["user_id"]
    message_history = state["message_history"]

    if check_strike(user_id):
        return {"response": STRIKE_BLOCK_MESSAGE}

    last_message = message_history[-1]
    if not isinstance(last_message, HumanMessage):
        return {}

    validated_content = build_validated_message(str(last_message.content))

    if validated_content is None:
        strike_count = register_strike(user_id)
        if check_strike(user_id):
            return {"response": get_strike_message(MAX_STRIKES)}
        return {"response": get_strike_message(strike_count)}

    updated_history = list(message_history[:-1]) + [
        HumanMessage(content=validated_content)
    ]
    return {"message_history": updated_history}


def _date_range(start: str | None, end: str | None) -> str | None:
    if start and end:
        return f"{start}–{end}"
    return start or end


def _row_line(segments: list[str | None], comments: str | None = None) -> str | None:
    line = ", ".join(s for s in segments if s)
    if comments:
        line = f"{line}: {comments}" if line else comments
    return line or None


def _section(title: str, rows: list | None, build) -> str | None:
    if not rows:
        return None
    lines = [line for row in rows if (line := build(row))]
    if not lines:
        return None
    return f"{title}:\n" + "\n".join(lines)


async def cv_context_node(state: CareerBloomState) -> dict:
    cv = state.get("cv_data")
    if cv is None or not cv.has_content():
        return {}

    parts: list[str] = []

    if cv.headline:
        parts.append(f"Headline: {cv.headline}")

    if cv.self_summary:
        parts.append(f"Summary:\n{cv.self_summary}")

    def build_experience(row) -> str | None:
        head = " at ".join(p for p in (row.title, row.company) if p)
        return _row_line(
            [head, _date_range(row.start_date, row.end_date)], row.comments
        )

    def build_simple(name_field: str):
        def build(row) -> str | None:
            return _row_line([getattr(row, name_field)], row.comments)

        return build

    def build_dated(row) -> str | None:
        return _row_line(
            [row.center, _date_range(row.start_date, row.end_date)], row.comments
        )

    def build_education(row) -> str | None:
        return _row_line(
            [row.edu_center, _date_range(row.start_date, row.end_date)], row.comments
        )

    def build_language(row) -> str | None:
        line = f"{row.language} ({row.level})" if row.level else row.language
        if row.comments:
            line = f"{line}: {row.comments}" if line else row.comments
        return line or None

    def build_project(row) -> str | None:
        return _row_line(
            [row.name, row.organisation, row.link, row.tech_stack], row.comments
        )

    for section in (
        _section("Experience", cv.experience, build_experience),
        _section("Skills", cv.skills, build_simple("skill")),
        _section("Tech Stack", cv.tech_stack, build_simple("name")),
        _section("Education", cv.education, build_education),
        _section("Languages", cv.languages, build_language),
        _section("Awards", cv.awards, build_simple("name")),
        _section("Publications", cv.publications, build_simple("name")),
        _section("Volunteering", cv.volunteering, build_dated),
        _section("Projects", cv.projects, build_project),
    ):
        if section:
            parts.append(section)

    return {"cv_context_str": "\n\n".join(parts)}


async def career_context_node(state: CareerBloomState) -> dict:
    career_context = state["career_context"]
    if career_context is None:
        return {}
    return {"career_context_str": career_context}


async def llm_call_node(
    state: CareerBloomState,
    db: AsyncSession,
    selected_model: str | None,
    system_prompt: str,
) -> dict:
    if state.get("response") == STRIKE_BLOCK_MESSAGE:
        return {}

    prompt = (
        [SystemMessage(GENERAL_TONE), SystemMessage(system_prompt)]
        + (
            [HumanMessage(state["cv_context_str"])]
            if state.get("cv_context_str")
            else []
        )
        + (
            [HumanMessage(state["career_context_str"])]
            if state.get("career_context_str")
            else []
        )
        + state["message_history"]
    )

    start_time = time.monotonic()
    full_response = ""
    tokens_used = 0
    model_name = ""
    last_status: str | None = None

    try:
        async for update in run_with_fallback(
            prompt=prompt,
            user_id=state["user_id"],
            db=db,
            selected_model=selected_model,
        ):
            if update.chunk:
                full_response += update.chunk
            if update.status != last_status:
                last_status = update.status
                await adispatch_custom_event(
                    FALLBACK_STATUS_EVENT,
                    {"status": update.status},
                )
            if update.result:
                tokens_used = update.result.tokens_used
                model_name = update.result.model_name

    except LimitExceededError as e:
        return {"response": str(e)}
    except AllModelsUnavailableError as e:
        return {"response": str(e)}

    await _log_event(
        user_id=state["user_id"],
        feature=state["feature"],
        duration_ms=int((time.monotonic() - start_time) * 1000),
        suspicious=False,
        db=db,
    )

    return {
        "response": full_response,
        "tokens_used": tokens_used,
        "model_name": model_name,
    }


async def output_validation_node(
    state: CareerBloomState,
    db: AsyncSession,
) -> dict:
    response = state.get("response", "")

    if response in (SAFE_RESPONSE_FAILURE, STRIKE_BLOCK_MESSAGE):
        return {}

    is_safe, reason = validate_output(response)

    if not is_safe:
        retry_count = state.get("retry_count", 0)
        logger.warning(
            "Suspicious output detected",
            extra={
                "user_id": state["user_id"],
                "reason": reason,
                "retry_count": retry_count,
            },
        )
        await _log_event(
            user_id=state["user_id"],
            feature=state["feature"],
            duration_ms=0,
            suspicious=True,
            db=db,
        )
        return {
            "response": SAFE_RESPONSE_FAILURE,
            "retry_count": retry_count + 1,
        }

    return {}


async def application_intent_node(
    state: CareerBloomState,
    db: AsyncSession,
) -> dict:
    response = state.get("response", "")

    if response in (SAFE_RESPONSE_FAILURE, STRIKE_BLOCK_MESSAGE):
        return {}

    try:
        repo = ApplicationRepository(db)
        await repo.create_if_not_duplicate(
            UUID(state["user_id"]),
            state.get("job_title"),
            state.get("company_name"),
            None,
        )
    except Exception:  # noqa: BLE001
        logger.warning("Failed to save application for user %s", state["user_id"])
        return {}

    return {"application_intent": True}


async def _log_event(
    user_id: str,
    feature: str,
    duration_ms: int,
    suspicious: bool,
    db: AsyncSession,
) -> None:
    from sqlalchemy import text

    try:
        await db.execute(
            text("""
                 INSERT INTO logs (user_id, feature, duration_ms, suspicious, created_at)
                 VALUES (CAST(:user_id AS uuid), :feature, :duration_ms, :suspicious, NOW())
                 """),
            {
                "user_id": user_id,
                "feature": feature,
                "duration_ms": duration_ms,
                "suspicious": suspicious,
            },
        )
        await db.commit()
    except Exception:
        logger.warning("Failed to write log entry for user %s", user_id)
