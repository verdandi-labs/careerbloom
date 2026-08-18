from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Neon / PostgreSQL
    NEON_DATABASE_URL: str = ""

    # Crypto
    HMAC_SECRET: str

    # Google Cloud KMS
    GOOGLE_KMS_KEY_NAME: str = ""
    GOOGLE_APPLICATION_CREDENTIALS_JSON: str = ""

    # Google AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"

    # SendGrid
    SENDGRID_API_KEY: str = ""

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
