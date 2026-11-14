import json
from dataclasses import dataclass
from typing import Literal

SSE_DONE = "[DONE]"

_PAYLOAD_KEYS: dict[str, str] = {
    "token": "content",
    "status": "status",
    "error": "error",
}


@dataclass
class StreamEvent:
    kind: Literal["token", "status", "error"]
    text: str


def sse_frame(event: StreamEvent) -> str:
    return f"data: {json.dumps({_PAYLOAD_KEYS[event.kind]: event.text})}\n\n"
