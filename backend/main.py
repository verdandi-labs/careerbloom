import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from config import get_settings
from database import Base, router as db_router, global_engine


async def _create_tables():
    try:
        async with global_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_create_tables())
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
from auth.magic_router import router as magic_auth_router
from profiles.router import router as profile_router
from cv.router import router as cv_router
from chat.router import router as chat_router
from cover_letters.router import router as cover_letters_router
from tenant.router import router as tenant_router

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(magic_auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(profile_router, prefix=settings.API_V1_PREFIX)
app.include_router(cv_router, prefix=settings.API_V1_PREFIX)
app.include_router(chat_router, prefix=settings.API_V1_PREFIX)
app.include_router(cover_letters_router, prefix=settings.API_V1_PREFIX)
app.include_router(tenant_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok"}

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
