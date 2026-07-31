import json
from google import genai
from google.genai import types
from config import get_settings

settings = get_settings()
client = genai.Client(api_key=settings.GEMINI_API_KEY)

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
    system = BLOOM_SYSTEM_PROMPT + (f"\n\nUser's CV:\n{cv_text}" if cv_text else "")

    history = [
        types.Content(
            role="model" if m["role"] == "assistant" else "user",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages[:-1]
    ]

    last_message = messages[-1]["content"] if messages else ""

    return client.models.generate_content_stream(
        model=settings.GOOGLE_GEMINI_3_FLASH_MODEL,
        contents=history + [types.Content(role="user", parts=[types.Part(text=last_message)])],
        config=types.GenerateContentConfig(system_instruction=system),
    )
