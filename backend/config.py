from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    NEON_DATABASE_URL: str = ""

    HMAC_SECRET: str
    MASTER_KEY: str

    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"

    OPENROUTER_API_KEY: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    SESSION_SECRET: str = ""

    # App
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173,https://careerbloom-e5ne.onrender.com"
    API_V1_PREFIX: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
