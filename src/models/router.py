from fastapi import APIRouter

from llm.cloudflare import AVAILABLE_MODELS as CF_MODELS
from llm.cloudflare import DEFAULT_MODEL as CF_DEFAULT
from llm.groq import AVAILABLE_MODELS as GROQ_MODELS
from llm.groq import DEFAULT_MODEL as GROQ_DEFAULT

router = APIRouter(prefix="/models", tags=["models"])

MODEL_DISPLAY_NAMES = {
    "openai/gpt-oss-120b": "GPT OSS 120B",
    "openai/gpt-oss-20b": "GPT OSS 20B",
    "qwen/qwen3.8-27b": "Qwen 3.8 27B",
    "@cf/cloudflare/clef-flash": "Clef Flash",
    "@cf/cloudflare/clef-omni": "Clef Omni",
    "@cf/mistral/mistral-small-3.1-24b-instruct": "Mistral Small 3.1",
    "@cf/qwen/qwen3.8-27b": "Qwen 3.8 27B (Cloudflare)",
    "@cf/zai-org/glm-4.7-flash": "GLM 4.7 Flash",
}


@router.get("")
async def list_models():
    return {
        "providers": [
            {
                "name": "Groq",
                "default": GROQ_DEFAULT,
                "models": [
                    {"id": m, "display_name": MODEL_DISPLAY_NAMES.get(m, m)}
                    for m in GROQ_MODELS
                ],
            },
            {
                "name": "Cloudflare",
                "default": CF_DEFAULT,
                "models": [
                    {"id": m, "display_name": MODEL_DISPLAY_NAMES.get(m, m)}
                    for m in CF_MODELS
                ],
            },
        ]
    }
