from typing import TypedDict

from langchain_core.messages import BaseMessage

from cv.schemas import CvData


class CareerBloomState(TypedDict):
    user_id: str
    feature: str
    cv_data: CvData | None
    message_history: list[BaseMessage]
    response: str
    tokens_used: int
    model_name: str
    job_description: str | None
    job_title: str | None
    company_name: str | None
    application_intent: bool | None
    career_context: str | None
    cv_context_str: str | None
    career_context_str: str | None
    retry_count: int
