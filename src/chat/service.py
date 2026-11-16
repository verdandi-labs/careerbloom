import json
import re

from pydantic import ValidationError

from chat.schemas import ChatSuggestion, CoverLetterSuggestion, CvRowSuggestion

_SUGGESTION_BLOCK_RE = re.compile(r"```json\s*([\s\S]*?)```")


def parse_suggestion(full_response: str) -> tuple[str, dict | None]:
    match = _SUGGESTION_BLOCK_RE.search(full_response)
    raw_text = match.group(1) if match else full_response
    try:
        raw = json.loads(raw_text.strip())
    except json.JSONDecodeError:
        return full_response.strip(), None
    if not isinstance(raw, dict):
        return full_response.strip(), None
    try:
        if raw.get("type") == "cover_letter":
            suggestion = CoverLetterSuggestion.model_validate(raw)
        elif raw.get("type") == "row_suggestion":
            suggestion = CvRowSuggestion.model_validate(raw)
        else:
            suggestion = ChatSuggestion.model_validate(raw)
    except ValidationError:
        return full_response.strip(), None
    if match:
        clean = (full_response[: match.start()] + full_response[match.end() :]).strip()
    else:
        clean = ""
    return clean, suggestion.model_dump()
