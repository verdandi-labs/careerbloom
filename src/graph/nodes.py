import logging
import time
from uuid import UUID

from langchain_core.callbacks import adispatch_custom_event
from langchain_core.messages import HumanMessage
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


async def llm_call_node(
    state: CareerBloomState,
    db: AsyncSession,
    selected_model: str | None = None,
) -> dict:
    if state.get("response") == STRIKE_BLOCK_MESSAGE:
        return {}

    start_time = time.monotonic()
    full_response = ""
    tokens_used = 0
    model_name = ""
    last_status: str | None = None

    try:
        async for update in run_with_fallback(
            prompt=state["message_history"],
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
        feature=_detect_feature(state),
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
            feature=_detect_feature(state),
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
                 VALUES (:user_id::uuid, :feature, :duration_ms, :suspicious, NOW())
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


def _detect_feature(state: CareerBloomState) -> str:
    if state.get("job_description") and state.get("job_title"):
        return "cover_letter"
    if state.get("job_description"):
        return "job_compatibility"
    if state.get("career_context"):
        return "career_direction"
    return "cv_chat"
