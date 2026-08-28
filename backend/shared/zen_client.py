import asyncio
import json
import logging
import time
from collections.abc import AsyncIterator

import httpx

from config import get_settings

logger = logging.getLogger(__name__)

DEFAULT_ZEN_MODEL = "mimo-v2.5-free"

_cached_models: list[str] = []
_cache_timestamp: float = 0


class ZenClientError(Exception):
    pass


class AllModelsFailedError(ZenClientError):
    pass


async def get_available_models() -> list[str]:
    global _cached_models, _cache_timestamp
    settings = get_settings()

    if time.time() - _cache_timestamp < settings.ZEN_MODEL_REFRESH_HOURS * 3600:
        return _cached_models

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{settings.ZEN_BASE_URL}/models",
                headers={"Authorization": f"Bearer {settings.ZEN_API_KEY}"},
            )
            response.raise_for_status()
        _cached_models = [entry["id"] for entry in response.json().get("data", [])]
        _cache_timestamp = time.time()
        return _cached_models
    except Exception:
        if _cached_models:
            logger.warning("Zen model list refresh failed, serving stale cache")
            return _cached_models
        raise ZenClientError("Could not load Zen models and no cache available") from None


def get_cache_status() -> dict:
    return {
        "models": _cached_models,
        "cached_at": _cache_timestamp,
    }


def _fresh_cached_models() -> list[str]:
    """Return cached models only if the cache is fresh; never fetches."""
    settings = get_settings()
    if time.time() - _cache_timestamp < settings.ZEN_MODEL_REFRESH_HOURS * 3600:
        return _cached_models
    asyncio.create_task(get_available_models())
    return []


def _build_candidates(user_model: str | None, available: list[str]) -> list[str]:
    candidates: list[str] = [DEFAULT_ZEN_MODEL]
    if user_model:
        candidates.insert(0, user_model)
    for model in available:
        if model not in candidates:
            candidates.append(model)
    return candidates


def _is_transient_model_failure(status: int, body: str) -> bool:
    return status == 503 or (status == 400 and "unavailable" in body.lower())


async def chat_completion(
    messages: list[dict],
    user_model: str | None = None,
    temperature: float = 0.0,
) -> str:
    settings = get_settings()
    candidates = _build_candidates(user_model, await get_available_models())

    async with httpx.AsyncClient(timeout=120) as client:
        for candidate in candidates:
            logger.info(f"Zen chat_completion using model {candidate}")
            try:
                response = await client.post(
                    f"{settings.ZEN_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.ZEN_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": candidate,
                        "messages": messages,
                        "temperature": temperature,
                        "max_tokens": 4096,
                    },
                )
            except httpx.HTTPError as e:
                logger.warning(f"Zen model {candidate} unavailable ({e}), trying next")
                continue

            if response.status_code in (429, 503):
                logger.warning(
                    f"Zen model {candidate} unavailable ({response.status_code}), trying next"
                )
                continue
            if _is_transient_model_failure(response.status_code, response.text):
                logger.warning(
                    f"Zen model {candidate} unavailable ({response.status_code}), trying next"
                )
                continue
            if not response.is_success:
                raise ZenClientError(f"Zen error {response.status_code}: {response.text}")

            return response.json()["choices"][0]["message"]["content"]

    if len(candidates) <= 1:
        raise ZenClientError(
            "All candidates are exhausted: model cache is empty and the default model failed"
        )
    raise AllModelsFailedError("All Zen models failed")


async def stream_chat_completion(
    messages: list[dict],
    user_model: str | None = None,
) -> AsyncIterator[str]:
    settings = get_settings()
    available = await get_available_models()

    for attempt in range(2):
        candidates = _build_candidates(user_model, available)
        for candidate in candidates:
            logger.info(f"Zen stream_chat_completion using model {candidate}")
            try:
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(300.0, connect=10.0)
                ) as client:
                    async with client.stream(
                        "POST",
                        f"{settings.ZEN_BASE_URL}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.ZEN_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": candidate,
                            "messages": messages,
                            "stream": True,
                        },
                    ) as response:
                        if response.status_code in (400, 429, 503):
                            logger.warning(
                                f"Zen model {candidate} not available, trying another"
                            )
                            continue
                        body = ""
                        if not response.is_success:
                            body = (await response.aread()).decode(errors="replace")
                        if not response.is_success:
                            raise ZenClientError(f"Zen error {response.status_code}: {body}")

                        async for line in response.aiter_lines():
                            line = line.strip()
                            if not line.startswith("data:"):
                                continue
                            payload = line[len("data:"):].strip()
                            if payload == "[DONE]":
                                yield "[DONE]"
                                return
                            chunk = json.loads(payload)
                            if not chunk.get("choices"):
                                continue
                            content = chunk["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
            except (httpx.RemoteProtocolError, httpx.ReadError):
                logger.warning(f"Zen model {candidate} not available, trying another")
                continue
        if attempt == 0:
            logger.warning("All models failed, retrying in 15 seconds...")
            await asyncio.sleep(1)

    raise AllModelsFailedError("All Zen models failed")
