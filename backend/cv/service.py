import json
import re

from google import genai
from google.genai import types
from config import get_settings

settings = get_settings()

client = genai.Client(api_key=settings.GEMINI_API_KEY)

SECTION_HEADERS: dict[str, list[str]] = {
    "summary": ["summary", "professional summary", "profile", "about me", "objective", "career objective"],
    "experience": ["experience", "work experience", "professional experience", "employment", "work history", "relevant experience"],
    "education": ["education", "academic background", "academic experience", "academic history"],
    "skills": ["skills", "technical skills", "core competencies", "key skills", "areas of expertise"],
    "languages": ["languages", "language"],
    "certifications": ["certifications", "certificates", "certification", "professional certifications", "licenses"],
    "projects": ["projects", "project experience", "personal projects", "technical projects"],
    "volunteer": ["volunteer", "volunteer experience", "community service", "volunteering"],
    "awards": ["awards", "honors", "achievements", "honours", "awards and honors"],
    "publications": ["publications", "published works", "papers"],
    "references": ["references", "professional references"],
}

HEADER_PATTERN = re.compile(
    r"^(?:\*{1,3}\s*)?(" + "|".join(
        re.escape(h) for headers in SECTION_HEADERS.values() for h in headers
    ) + r")\s*(?:\*{1,3})?[\s:]*$",
    re.IGNORECASE | re.MULTILINE,
)

CONTACT_PATTERNS = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "email"),
    (re.compile(r"\+?\d[\d\s\-().]{7,}\d"), "phone"),
    (re.compile(r"(?:linkedin\.com|github\.com)[/\w%-]+", re.IGNORECASE), "url"),
]


def _parse_locally(text: str) -> dict[str, str]:
    result = {k: "" for k in [
        "name", "title", "contact", "summary", "experience", "education",
        "skills", "languages", "certifications", "projects", "volunteer",
        "awards", "publications", "references", "other",
    ]}

    sections: list[tuple[str, int, int]] = []
    for m in HEADER_PATTERN.finditer(text):
        header_raw = m.group(1).strip().lower()
        field = next(k for k, aliases in SECTION_HEADERS.items() if header_raw in aliases)
        sections.append((field, m.start(), m.end()))

    if not sections:
        result["other"] = text.strip()
        return result

    blocks: dict[str, str] = {}
    for i, (field, start, end) in enumerate(sections):
        next_start = sections[i + 1][1] if i + 1 < len(sections) else len(text)
        content = text[end:next_start].strip()
        if field in blocks:
            blocks[field] += "\n\n" + content
        else:
            blocks[field] = content
        result[field] = blocks[field]

    preamble = text[:sections[0][0]].strip()
    if preamble:
        lines = preamble.split("\n")
        result["name"] = lines[0].strip()
        contact_parts = []
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            matched = False
            for pattern, _ in CONTACT_PATTERNS:
                if pattern.search(line):
                    contact_parts.append(line)
                    matched = True
                    break
            if not matched and not result["title"]:
                result["title"] = line
            elif not matched:
                contact_parts.append(line)
        if contact_parts:
            result["contact"] = "\n".join(contact_parts)

    return result


async def parse_cv_text(text: str) -> dict[str, str]:
    return _parse_locally(text)


async def translate_fields(fields: dict[str, str], target_lang: str) -> dict[str, str]:
    prompt = f"""Translate the following CV fields to {target_lang}.
Preserve line breaks, bullet points, dashes, and indentation exactly.
Do not summarize, expand, reorder, or add commentary.
Keep proper nouns, company names, brand names, and email/URLs unchanged.
Translate dates and section labels to {target_lang}.
Return a JSON object with the same keys and translated values.

FIELDS:
{json.dumps(fields)}"""

    response = await client.aio.models.generate_content(
        model=settings.GOOGLE_GEMINI_2_5_FLASH_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


async def generate_cover_letter_ai(job_title: str, company: str, job_description: str, cv_text: str) -> dict[str, str]:
    prompt = f"""Write a warm, ATS-friendly cover letter for a {job_title} position at {company}.
250-350 words. Open with a hook tied to the company. Avoid cliches.
Return JSON with keys: content_en, content_es (natural Spanish translation).

Job description: {job_description}
CV: {cv_text[:8000]}"""

    response = await client.aio.models.generate_content(
        model=settings.GOOGLE_GEMINI_3_FLASH_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)
