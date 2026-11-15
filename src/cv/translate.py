from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from cv.extract import extract_json
from cv.schemas import CvData
from llm.fallback import run_invoke_with_fallback

TRANSLATE_PROMPT = ""
SAFETY_BOUNDARY = ""

SYSTEM_PROMPT = (
    "You are a CV translator. Respond ONLY with a single valid JSON object. "
    "No markdown fences, no explanation, no preamble. "
    "Output must start with { and end with }."
)


async def translate_cv(
    data: CvData, language: str, user_id: str, db: AsyncSession
) -> CvData:
    prompt = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=TRANSLATE_PROMPT.format(
                language=language, json=data.model_dump_json()
            )
            + "\n\n"
            + SAFETY_BOUNDARY
        ),
    ]
    result = await run_invoke_with_fallback(prompt=prompt, user_id=user_id, db=db)
    return CvData.model_validate(extract_json(result.text))
