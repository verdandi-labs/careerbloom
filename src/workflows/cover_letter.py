from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph

from graph.edges import after_input_validation, after_output_validation_with_intent
from graph.nodes import (
    application_intent_node,
    input_validation_node,
    llm_call_node,
    output_validation_node,
)
from graph.state import CareerBloomState


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
    graph.add_conditional_edges("input_validation", after_input_validation)
    graph.add_edge("llm_call", "output_validation")
    graph.add_conditional_edges(
        "output_validation", after_output_validation_with_intent
    )
    graph.add_edge("application_intent", END)

    return graph.compile()


cover_letter_graph = build_cover_letter_graph()
