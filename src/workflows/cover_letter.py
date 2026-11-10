from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph

from graph.nodes import (
    application_intent_node,
    input_validation_node,
    llm_call_node,
    output_validation_node,
)
from graph.security import MAX_RETRIES, SAFE_RESPONSE_FAILURE
from graph.state import CareerBloomState


def _after_input_validation(state: CareerBloomState) -> str:
    if state.get("response"):
        return END
    return "llm_call"


def _after_output_validation(state: CareerBloomState) -> str:
    response = state.get("response", "")
    retry_count = state.get("retry_count", 0)
    if response == SAFE_RESPONSE_FAILURE and retry_count < MAX_RETRIES:
        return "llm_call"
    return "application_intent"


async def _input_validation(state: CareerBloomState, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    return await input_validation_node(state, db)


async def _llm_call(state: CareerBloomState, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    selected_model = config["configurable"].get("selected_model")
    return await llm_call_node(state, db, selected_model)


async def _output_validation(state: CareerBloomState, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    return await output_validation_node(state, db)


async def _application_intent(state: CareerBloomState, config: RunnableConfig) -> dict:
    db = config["configurable"]["db"]
    return await application_intent_node(state, db)


def build_cover_letter_graph() -> StateGraph:
    graph = StateGraph(CareerBloomState)

    graph.add_node("input_validation", _input_validation)
    graph.add_node("llm_call", _llm_call)
    graph.add_node("output_validation", _output_validation)
    graph.add_node("application_intent", _application_intent)

    graph.add_edge(START, "input_validation")
    graph.add_conditional_edges("input_validation", _after_input_validation)
    graph.add_edge("llm_call", "output_validation")
    graph.add_conditional_edges("output_validation", _after_output_validation)
    graph.add_edge("application_intent", END)

    return graph.compile()


cover_letter_graph = build_cover_letter_graph()
