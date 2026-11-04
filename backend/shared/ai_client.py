import json
import logging
from collections.abc import AsyncIterator

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]


class AllModelsFailedError(Exception):
    pass


async def chat_completion(
    messages: list[dict],
    user_model: str | None = None,
    temperature: float = 0.0,
) -> str:
    settings = get_settings()
    candidates = [user_model, *MODELS] if user_model else list(MODELS)

    async with httpx.AsyncClient(timeout=120) as client:
        for model in candidates:
            logger.info(f"chat_completion using model {model}")
            try:
                response = await client.post(
                    f"{settings.OPENAI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": 4096,
                    },
                )
            except httpx.HTTPError as e:
                logger.warning(f"Model {model} unavailable ({e}), trying next")
                continue

            if response.status_code in (429, 503):
                logger.warning(
                    f"Model {model} unavailable ({response.status_code}), trying next"
                )
                continue
            if response.status_code == 400 and "unavailable" in response.text.lower():
                logger.warning(
                    f"Model {model} unavailable ({response.status_code}), trying next"
                )
                continue
            if not response.is_success:
                logger.warning(
                    f"Model {model} error {response.status_code}, trying next"
                )
                continue

            return response.json()["choices"][0]["message"]["content"]

    raise AllModelsFailedError("All models failed")


async def stream_chat_completion(
    messages: list[dict],
    user_model: str | None = None,
) -> AsyncIterator[str]:
    settings = get_settings()
    candidates = [user_model, *MODELS] if user_model else list(MODELS)

    for model in candidates:
        succeeded = False
        try:
            async with (
                httpx.AsyncClient(timeout=httpx.Timeout(300.0, connect=10.0)) as client,
                client.stream(
                    "POST",
                    f"{settings.OPENAI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "stream": True,
                    },
                ) as response,
            ):
                if response.status_code not in (200,):
                    logger.warning(
                        f"Model {model} not available ({response.status_code}), trying next"
                    )
                else:
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line.startswith("data:"):
                            continue
                        payload = line[len("data:") :].strip()
                        if payload == "[DONE]":
                            yield "[DONE]"
                            succeeded = True
                            break
                        try:
                            chunk = json.loads(payload)
                        except json.JSONDecodeError:
                            continue
                        if not chunk.get("choices"):
                            continue
                        content = chunk["choices"][0]["delta"].get("content", "")
                        if content:
                            yield content
        except (httpx.RemoteProtocolError, httpx.ReadError) as e:
            logger.warning(f"Model {model} not available ({e}), trying next")
        if succeeded:
            return

    raise AllModelsFailedError("All models failed")
