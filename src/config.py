from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    NEON_DATABASE_URL: str = ""

    HMAC_SECRET: str
    MASTER_KEY: str

    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    CLOUDFLARE_API_KEY: str = ""
    CLOUDFLARE_ACCOUNT_ID: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    SESSION_SECRET: str = ""

    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:5173,https://careerbloom-e5ne.onrender.com"
    API_V1_PREFIX: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@property
def CLOUDFLARE_BASE_URL(self) -> str:
    return f"https://api.cloudflare.com/client/v4/accounts/{self.CLOUDFLARE_ACCOUNT_ID}/ai/v1"

@lru_cache
def get_settings() -> Settings:
    return Settings()
