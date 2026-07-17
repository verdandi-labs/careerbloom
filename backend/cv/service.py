import asyncio
import json

import google.generativeai as genai
from config import get_settings

settings = get_settings()

genai.configure(api_key=settings.GOOGLE_AI_API_KEY)


async def parse_cv_text(text: str) -> dict[str, str]:
    model = genai.GenerativeModel(settings.GOOGLE_GEMINI_2_5_FLASH_MODEL)
    prompt = f"""Parse the following CV text into structured fields.
Return a JSON object with these keys: name, title, contact, summary, experience, education, skills, languages, certifications, projects, volunteer, awards, publications, references, other.
Each value is a string. Empty string if the section is not present.
Do not summarize or reorder. Preserve verbatim text.

CV TEXT:
{text[:32000]}"""

    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


async def translate_fields(fields: dict[str, str], target_lang: str) -> dict[str, str]:
    model = genai.GenerativeModel(settings.GOOGLE_GEMINI_2_5_FLASH_MODEL)
    prompt = f"""Translate the following CV fields to {target_lang}.
Preserve line breaks, bullet points, dashes, and indentation exactly.
Do not summarize, expand, reorder, or add commentary.
Keep proper nouns, company names, brand names, and email/URLs unchanged.
Translate dates and section labels to {target_lang}.
Return a JSON object with the same keys and translated values.

FIELDS:
{json.dumps(fields)}"""

    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


async def generate_cover_letter_ai(job_title: str, company: str, job_description: str, cv_text: str) -> dict[str, str]:
    model = genai.GenerativeModel(settings.GOOGLE_GEMINI_3_FLASH_MODEL)
    prompt = f"""Write a warm, ATS-friendly cover letter for a {job_title} position at {company}.
250-350 words. Open with a hook tied to the company. Avoid cliches.
Return JSON with keys: content_en, content_es (natural Spanish translation).

Job description: {job_description}
CV: {cv_text[:8000]}"""

    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)
