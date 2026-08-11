from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Neon / PostgreSQL
    NEON_DATABASE_URL: str = ""

    # Crypto
    MASTER_KEY: str
    HMAC_SECRET: str

    # Google AI
    GEMINI_API_KEY: str = ""
    GOOGLE_GEMINI_2_5_FLASH_MODEL: str = "gemini-2.5-flash"
    GOOGLE_GEMINI_3_FLASH_MODEL: str = "gemini-3-flash-preview"

    # SendGrid
    SENDGRID_API_KEY: str = ""

    # App
    FRONTEND_URL: str = "https://careerbloom-e5ne.onrender.com"
    CORS_ORIGINS: str = "http://localhost:5173,https://careerbloom-e5ne.onrender.com"
    API_V1_PREFIX: str = "/api/v1"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
