import re
from urllib.parse import quote
import httpx
from config import get_settings

settings = get_settings()


def _extract_project_ref(url: str) -> str:
    match = re.search(r"https?://([^.]+)\.supabase\.co", url)
    if not match:
        raise ValueError("Invalid Supabase URL. Must be like https://xxxxx.supabase.co")
    return match.group(1)


def build_db_url(supabase_url: str, password: str) -> str:
    ref = _extract_project_ref(supabase_url)
    encoded = quote(password, safe="")
    return f"postgresql+asyncpg://postgres:{encoded}@db.{ref}.supabase.co:5432/postgres"


async def validate_connection(supabase_url: str, password: str) -> bool:
    from sqlalchemy.ext.asyncio import create_async_engine

    db_url = build_db_url(supabase_url, password)
    engine = create_async_engine(db_url, echo=False)
    try:
        async with engine.connect() as conn:
            await conn.execute(conn.default_schema_name or "SELECT 1")
        return True
    except Exception:
        return False
    finally:
        await engine.dispose()
