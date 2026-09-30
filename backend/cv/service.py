import json
import logging
import re

from slowapi import Limiter
from slowapi.util import get_remote_address

from prompts import load
from cv.schemas import CvData, FIELD_MODELS, RAW_MODELS, TEXT_FIELDS
from shared.prompts import SAFETY_BOUNDARY, wrap_untrusted
from shared.ai_client import AllModelsFailedError, chat_completion

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

MAX_TEXT_LENGTH = 20_000

CV_PARSE_PROMPT = load("cv_parse")

TRANSLATE_PROMPT = load("cv_translate")


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
            text = text[first_newline + 1:]
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


async def parse_all_sections(text: str) -> CvData:
    prompt = CV_PARSE_PROMPT.replace("__TEXT__", text[:MAX_TEXT_LENGTH]) + "\n\n" + SAFETY_BOUNDARY
    raw = await chat_completion(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a CV parser. Respond ONLY with a single "
                    "valid JSON object. No markdown fences, no explanation, "
                    "no preamble. Output must start with { and end with }."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.1,
    )
    data = extract_json(raw)
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


async def translate_cv(data: CvData, language: str) -> CvData:
    raw = await chat_completion(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a CV translator. Respond ONLY with a single "
                    "valid JSON object. No markdown fences, no explanation, "
                    "no preamble. Output must start with { and end with }."
                ),
            },
            {
                "role": "user",
                "content": TRANSLATE_PROMPT.format(
                    language=language,
                    json=data.model_dump_json(),
                )
                + "\n\n"
                + SAFETY_BOUNDARY,
            },
        ],
        temperature=0.2,
    )
    return CvData.model_validate(extract_json(raw))


async def generate_cover_letter_ai(job_title: str, company: str, job_description: str, cv_text: str, career_direction: str | None = None) -> str:
    instructions = (
        "Write a warm, ATS-friendly cover letter for the position below.\n"
        "250-350 words. Open with a hook tied to the company. Avoid cliches.\n"
        "Return JSON with exactly one key: content."
    )
    data_block = wrap_untrusted(
        job_title=job_title,
        company=company,
        job=job_description,
        cv=cv_text[:8000],
    )
    career_block = f"\n\n<career_direction>{career_direction}</career_direction>" if career_direction else ""
    prompt = f"{instructions}\n\n{data_block}{career_block}\n\n{SAFETY_BOUNDARY}"

    try:
        raw = await chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
    except AllModelsFailedError:
        raise ValueError("AI service temporarily unavailable. Please try again.")
    content = extract_json(raw).get("content")
    if not content or not content.strip():
        raise ValueError("Empty cover letter generated")
    return content.strip()
