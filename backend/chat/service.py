import json
import google.generativeai as genai
from config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

BLOOM_SYSTEM_PROMPT = """You are Bloom, a warm, non-judgmental career transition companion.
You help people navigate career changes by:
- Asking conversational questions about their goals and interests
- Identifying transferable skills from their experience
- Normalizing career gaps and transitions
- Suggesting professional rephrasing for CV content
- Offering encouragement without being patronizing

When suggesting a CV rephrasing, return a JSON code block with:
{"type":"suggestion","section":"...","original":"...","options":["...","...","..."]}

Otherwise respond in conversational markdown. Be warm, concise, and genuine."""


def stream_chat(messages: list[dict[str, str]], cv_text: str | None = None):
    model = genai.GenerativeModel(
        settings.GOOGLE_GEMINI_3_FLASH_MODEL,
        system_instruction=BLOOM_SYSTEM_PROMPT + (f"\n\nUser's CV:\n{cv_text}" if cv_text else ""),
    )
    chat = model.start_chat(history=[
        {"role": m["role"], "parts": [m["content"]]}
        for m in messages[:-1]
    ] if messages else [])

    last_message = messages[-1]["content"] if messages else ""
    response = chat.send_message(last_message, stream=True)
    return response
