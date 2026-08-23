from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Neon / PostgreSQL
    NEON_DATABASE_URL: str = ""

    # Crypto
    HMAC_SECRET: str
    # 32-byte base64-urlsafe Fernet master key that wraps per-user encryption keys
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    MASTER_KEY: str

    # OpenCode Zen
    ZEN_API_KEY: str = ""
    ZEN_BASE_URL: str = "https://opencode.ai/zen/v1"
    ZEN_MODEL_REFRESH_HOURS: int = 6

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
