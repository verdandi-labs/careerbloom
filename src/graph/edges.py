from langgraph.graph import END

from graph.security import MAX_RETRIES, SAFE_RESPONSE_FAILURE
from graph.state import CareerBloomState


def _retry_available(state: CareerBloomState) -> bool:
    return (
        state.get("response") == SAFE_RESPONSE_FAILURE
        and state.get("retry_count", 0) < MAX_RETRIES
    )


def after_input_validation(state: CareerBloomState) -> str:
    if state.get("response"):
        return END
    return "llm_call"


def after_output_validation(state: CareerBloomState) -> str:
    if _retry_available(state):
        return "llm_call"
    return END


def after_output_validation_with_intent(state: CareerBloomState) -> str:
    if _retry_available(state):
        return "llm_call"
    if state.get("response") == SAFE_RESPONSE_FAILURE:
        return END
    return "application_intent"
