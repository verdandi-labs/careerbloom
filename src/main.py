import logging
import re
from contextlib import asynccontextmanager
from typing import ClassVar

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware

from config import get_settings
from database import dispose_engine, ensure_schema
from shared.limiter import limiter

logger = logging.getLogger("startup")


class ScrubFilter(logging.Filter):
    PATTERNS: ClassVar[list[tuple[re.Pattern[str], str]]] = [
        (re.compile(r"Bearer\s+\S+", re.IGNORECASE), "Bearer [REDACTED]"),
        (re.compile(r"session=[^\s&;]+", re.IGNORECASE), "session=[REDACTED]"),
        (re.compile(r"token=[^\s&;]+", re.IGNORECASE), "token=[REDACTED]"),
        (
            re.compile(r"database_url=[^\s&;]+", re.IGNORECASE),
            "database_url=[REDACTED]",
        ),
    ]

    def filter(self, record):
        msg = str(record.getMessage())
        for pattern, replacement in self.PATTERNS:
            msg = pattern.sub(replacement, msg)
        record.msg = msg
        record.args = ()
        return True


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' blob: 'unsafe-eval' 'wasm-unsafe-eval'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: blob:; "
            "connect-src 'self' https://fonts.gstatic.com; "
            "worker-src blob:; "
            "object-src 'none'"
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.getLogger().addFilter(ScrubFilter())
    import chat.models  # noqa: F401
    import shared.models.applications
    import shared.models.career_direction
    import shared.models.cover_letters
    import shared.models.cv
    import shared.models.user  # noqa: F401

    await ensure_schema()
    logger.info("Database schema verified")
    yield
    await dispose_engine()


settings = get_settings()

app = FastAPI(
    title="CareerBloom API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda req, exc: JSONResponse(
        {"detail": "Too many requests, please slow down"}, status_code=429
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "X-CSRF-Token"],
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    session_cookie="oauth_state",
    https_only=not settings.DEBUG,
    same_site="lax",
)


@app.get("/health")
async def health():
    return {"status": "ok"}
