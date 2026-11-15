from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy.ext.asyncio import AsyncSession

from cv.extract import MAX_TEXT_LENGTH, extract_json
from cv.schemas import FIELD_MODELS, RAW_MODELS, TEXT_FIELDS, CvData
from llm.fallback import run_invoke_with_fallback

CV_PARSE_PROMPT = ""
SAFETY_BOUNDARY = ""

SYSTEM_PROMPT = (
    "You are a CV parser. Respond ONLY with a single valid JSON object. "
    "No markdown fences, no explanation, no preamble. "
    "Output must start with { and end with }."
)


async def parse_all_sections(text: str, user_id: str, db: AsyncSession) -> CvData:
    prompt = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=CV_PARSE_PROMPT.replace("__TEXT__", text[:MAX_TEXT_LENGTH])
            + "\n\n"
            + SAFETY_BOUNDARY
        ),
    ]
    result = await run_invoke_with_fallback(prompt=prompt, user_id=user_id, db=db)
    data = extract_json(result.text)
    values: dict[str, object] = {}
    for field in TEXT_FIELDS:
        value = data.get(field)
        values[field] = value.strip() or None if isinstance(value, str) else None
    for field, item_model in FIELD_MODELS.items():
        raw_model = RAW_MODELS[field]
        entries = data.get(field) or []
        parsed_entries = [raw_model.model_validate(entry) for entry in entries]
        values[field] = [
            item_model(**entry.model_dump(), line_num=i + 1)
            for i, entry in enumerate(parsed_entries)
        ]
    return CvData(**values)
