from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass

from langchain_core.messages import BaseMessage


@dataclass
class LLMResponse:
    text: str
    tokens_used: int
    model_name: str


class BaseLLMClient(ABC):
    @abstractmethod
    async def generate(
            self,
            prompt: list[BaseMessage],
            user_id: str,
            bypass_limits: bool = False,
    ) -> LLMResponse:
        pass

    @abstractmethod
    async def stream(
            self,
            prompt: list[BaseMessage],
            user_id: str,
            bypass_limits: bool = False,
    ) -> AsyncIterator[str]:
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        pass
