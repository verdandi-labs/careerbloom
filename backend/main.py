from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import get_settings
from database import Base, router as db_router, global_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
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
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth.router import router as auth_router
from profiles.router import router as profile_router
from cv.router import router as cv_router
from chat.router import router as chat_router
from cover_letters.router import router as cover_letters_router
from tenant.router import router as tenant_router

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(profile_router, prefix=settings.API_V1_PREFIX)
app.include_router(cv_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)
app.include_router(cover_letters_router, prefix=settings.API_V1_PREFIX)
app.include_router(tenant_router, prefix=settings.API_V1_PREFIX)

frontend_dist = Path(__file__).resolve().parent / "frontend" / "dist"
if not frontend_dist.exists():
    frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


@app.get("/health")
async def health():
    return {"status": "ok"}
