from collections.abc import AsyncIterator

from langchain_core.messages import BaseMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from llm.base import BaseLLMClient, LLMResponse
from llm.security import MAX_TOKENS_PER_CALL, check_daily_limits, register_request

DEFAULT_MODEL = "@cf/cloudflare/clef-flash"

AVAILABLE_MODELS = [
    "@cf/cloudflare/clef-flash",
    "@cf/cloudflare/clef-omni",
    "@cf/mistral/mistral-small-3.1-24b-instruct",
    "@cf/qwen/qwen3.8-27b",
    "@cf/zai-org/glm-4.7-flash",
]


class CloudflareClient(BaseLLMClient):
    def __init__(self, model: str = DEFAULT_MODEL, max_tokens: int = MAX_TOKENS_PER_CALL):
        settings = get_settings()
        self._model = model
        self._max_tokens = max_tokens
        self._client = ChatOpenAI(
            api_key=settings.CLOUDFLARE_API_KEY,
            base_url=settings.CLOUDFLARE_BASE_URL,
            model=model,
            max_tokens=max_tokens,
        )

    def get_model_name(self) -> str:
        return self._model

    async def generate(
            self,
            prompt: list[BaseMessage],
            user_id: str,
            db: AsyncSession,
            bypass_limits: bool = False,
    ) -> LLMResponse:
        if not bypass_limits:
            await check_daily_limits(user_id, db)

        try:
            response = await self._client.ainvoke(prompt)
            usage = response.usage_metadata or {}
            tokens_used = usage.get("total_tokens", 0)
            await register_request(user_id, tokens_used, db)
            return LLMResponse(
                text=response.content,
                tokens_used=tokens_used,
                model_name=self._model,
            )
        except Exception as e:
            raise RuntimeError(f"Cloudflare model {self._model} failed: {e}") from e

    async def stream(
            self,
            prompt: list[BaseMessage],
            user_id: str,
            db: AsyncSession,
            bypass_limits: bool = False,
    ) -> AsyncIterator[str]:
        if not bypass_limits:
            await check_daily_limits(user_id, db)

        tokens_used = 0
        try:
            async for chunk in self._client.astream(prompt):
                usage = chunk.usage_metadata or {}
                tokens_used += usage.get("output_tokens", 0)
                if chunk.content:
                    yield chunk.content
            await register_request(user_id, tokens_used, db)
        except Exception as e:
            raise RuntimeError(f"Cloudflare model {self._model} failed: {e}") from e
