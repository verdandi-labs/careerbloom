from typing import TypedDict

from langchain_core.messages import BaseMessage


class CareerBloomState(TypedDict):
    user_id: str
    cv_data: dict | None
    message_history: list[BaseMessage]
    response: str
    tokens_used: int
    model_name: str
    job_description: str | None
    job_title: str | None
    company_name: str | None
    application_intent: bool | None
    career_context: str | None
