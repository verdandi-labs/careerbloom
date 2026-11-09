from collections.abc import AsyncGenerator
from dataclasses import dataclass

from langchain_core.messages import BaseMessage
from sqlalchemy.ext.asyncio import AsyncSession

from llm.base import BaseLLMClient, LLMResponse
from llm.cloudflare import AVAILABLE_MODELS as CLOUDFLARE_MODELS
from llm.cloudflare import CloudflareClient
from llm.groq import AVAILABLE_MODELS as GROQ_MODELS
from llm.groq import GroqClient


@dataclass
class FallbackUpdate:
    status: str
    result: LLMResponse | None = None
    chunk: str | None = None


class AllModelsUnavailableError(Exception):
    pass


def _build_groq_cascade(selected_model: str | None) -> list[str]:
    if not selected_model or selected_model not in GROQ_MODELS:
        return GROQ_MODELS
    idx = GROQ_MODELS.index(selected_model)
    return GROQ_MODELS[idx:] + GROQ_MODELS[:idx]


async def run_with_fallback(
        prompt: list[BaseMessage],
        user_id: str,
        db: AsyncSession,
        selected_model: str | None = None,
) -> AsyncGenerator[FallbackUpdate, None]:
    groq_cascade = _build_groq_cascade(selected_model)
    bypass_limits = False

    for i, model in enumerate(groq_cascade):
        try:
            client: BaseLLMClient = GroqClient(model=model)
            yield FallbackUpdate(status=f"Connected to {model}")
            async for chunk in client.stream(prompt, user_id, db, bypass_limits):
                yield FallbackUpdate(status=f"Connected to {model}", chunk=chunk)
            return
        except Exception:
            bypass_limits = True
            next_model = groq_cascade[i + 1] if i + 1 < len(groq_cascade) else CLOUDFLARE_MODELS[0]
            yield FallbackUpdate(
                status=f"{model} is currently unavailable, switching to {next_model}..."
            )

    for i, model in enumerate(CLOUDFLARE_MODELS):
        try:
            client = CloudflareClient(model=model)
            yield FallbackUpdate(status=f"Switching to backup provider, trying {model}...")
            async for chunk in client.stream(prompt, user_id, db, bypass_limits):
                yield FallbackUpdate(status=f"Connected to {model}", chunk=chunk)
            return
        except Exception:
            bypass_limits = True
            if i + 1 < len(CLOUDFLARE_MODELS):
                yield FallbackUpdate(
                    status=f"{model} is currently unavailable, switching to {CLOUDFLARE_MODELS[i + 1]}..."
                )

    yield FallbackUpdate(
        status="All models are currently unavailable. Please try again in a few minutes"
    )


async def run_invoke_with_fallback(
        prompt: list[BaseMessage],
        user_id: str,
        db: AsyncSession,
        selected_model: str | None = None,
) -> LLMResponse:
    groq_cascade = _build_groq_cascade(selected_model)
    bypass_limits = False

    for model in groq_cascade:
        try:
            client: BaseLLMClient = GroqClient(model=model)
            return await client.generate(prompt, user_id, db, bypass_limits)
        except Exception:
            bypass_limits = True

    for model in CLOUDFLARE_MODELS:
        try:
            client = CloudflareClient(model=model)
            return await client.generate(prompt, user_id, db, bypass_limits)
        except Exception:
            bypass_limits = True

    raise AllModelsUnavailableError(
        "All models are currently unavailable. Please try again in a few minutes"
    )
