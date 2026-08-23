import logging
import re
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from config import get_settings
from database import Base, router as db_router, global_engine
from shared.zen_client import ZenClientError, get_available_models, get_cache_status

logger = logging.getLogger("startup")


class ScrubFilter(logging.Filter):
    PATTERNS = [
        (re.compile(r"Bearer\s+\S+", re.I), "Bearer [REDACTED]"),
        (re.compile(r"session=[^\s&;]+", re.I), "session=[REDACTED]"),
        (re.compile(r"token=[^\s&;]+", re.I), "token=[REDACTED]"),
        (re.compile(r"database_url=[^\s&;]+", re.I), "database_url=[REDACTED]"),
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
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "object-src 'none'"
        )
        return response


async def _create_tables():
    try:
        async with global_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema verified")
    except Exception as e:
        logger.error("create_all failed: %s", e, exc_info=True)
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.getLogger().addFilter(ScrubFilter())
    await _create_tables()
    try:
        models = await get_available_models()
        logger.info(f"Zen models loaded: {models}")
    except ZenClientError as e:
        logger.error(f"Zen model warmup failed: {e}")
        raise
    yield
    await db_router.dispose_all()


app = FastAPI(
    title="careerBloom API",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

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

from auth.router import router as auth_router
from auth.magic_router import router as magic_auth_router
from auth.oauth_router import router as oauth_router
from cv.router import router as cv_router
from chat.router import router as chat_router
from cover_letters.router import router as cover_letters_router
from tenant.router import router as tenant_router
from career_direction.router import router as career_direction_router
from cv.service import limiter

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda req, exc: JSONResponse({"detail": "Too many requests, please slow down"}, status_code=429),
)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(magic_auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(oauth_router, prefix=settings.API_V1_PREFIX)
app.include_router(cv_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)
app.include_router(cover_letters_router, prefix=settings.API_V1_PREFIX)
app.include_router(tenant_router, prefix=settings.API_V1_PREFIX)
app.include_router(career_direction_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/models")
async def health_models():
    status = get_cache_status()
    if not status["models"]:
        raise HTTPException(status_code=503, detail="Model cache empty")
    return {
        "models": status["models"],
        "cached_at": datetime.fromtimestamp(
            status["cached_at"], tz=timezone.utc
        ).isoformat(),
        "ttl_hours": get_settings().ZEN_MODEL_REFRESH_HOURS,
    }

frontend_dist = Path(__file__).resolve().parent / "frontend" / "dist"
if not frontend_dist.exists():
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
api_prefix = settings.API_V1_PREFIX.strip("/")

if frontend_dist.exists():
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith(f"{api_prefix}/") or full_path == api_prefix:
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
