from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Neon / PostgreSQL
    NEON_DATABASE_URL: str = ""

    # Crypto
    HMAC_SECRET: str
    # 32-byte base64-urlsafe Fernet master key that wraps per-user encryption keys
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    MASTER_KEY: str

    # OpenAI (Groq, OpenAI compatible)
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "openai/gpt-oss-120b"

    # Mistral (fallback)
    MISTRAL_API_KEY: str = ""
    MISTRAL_BASE_URL: str = "https://api.mistral.ai/v1"
    MISTRAL_MODEL: str = "mistral-large-latest"

    # OpenRouter (fallback)
    OPENROUTER_API_KEY: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    SESSION_SECRET: str = ""

    # App
    DEBUG: bool = False
    FRONTEND_URL: str = "https://careerbloom-e5ne.onrender.com"
    CORS_ORIGINS: str = "http://localhost:5173,https://careerbloom-e5ne.onrender.com"
    API_V1_PREFIX: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
