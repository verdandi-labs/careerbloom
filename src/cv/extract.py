import json
import logging
import re

logger = logging.getLogger(__name__)

MAX_TEXT_LENGTH = 20_000


def extract_raw_text(text: str) -> str:
    # Strip docx2python placeholders (images, alt text, footnotes,
    # endnotes, failed checkboxes)
    text = re.sub(r"----[^-]+----(>[^<]*<)?", "", text)
    # Collapse runs of blank lines left behind by removed placeholders
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:MAX_TEXT_LENGTH].strip()


def extract_json(raw: str) -> dict:
    """Parse a JSON object from model output, tolerating markdown fences
    and surrounding prose. Raises ValueError with a log of the raw output
    when nothing parseable is found."""
    text = raw.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1 :]
        text = text.removesuffix("```").strip()
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass
    logger.error(f"Model returned unparseable JSON: {raw[:500]!r}")
    raise ValueError("AI returned invalid data, please try again")
