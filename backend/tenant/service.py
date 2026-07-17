import re
from urllib.parse import quote
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine, async_sessionmaker, AsyncSession
from cryptography.fernet import Fernet
from config import get_settings

settings = get_settings()
_cipher = Fernet(settings.ENCRYPTION_KEY.encode())

_engines: dict[str, AsyncEngine] = {}
_factories: dict[str, async_sessionmaker[AsyncSession]] = {}


def _extract_project_ref(url: str) -> str:
    match = re.search(r"https?://([^.]+)\.supabase\.co", url)
    if not match:
        raise ValueError("Invalid Supabase URL. Must be like https://xxxxx.supabase.co")
    return match.group(1)


def encrypt(text: str) -> str:
    return _cipher.encrypt(text.encode()).decode()


def decrypt(token: str) -> str:
    return _cipher.decrypt(token.encode()).decode()


def build_db_url(supabase_url: str, password: str) -> str:
    ref = _extract_project_ref(supabase_url)
    encoded = quote(password, safe="")
    return f"postgresql+asyncpg://postgres:{encoded}@db.{ref}.supabase.co:5432/postgres"


async def validate_connection(supabase_url: str, password: str) -> bool:
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


def get_or_create_engine(db_url: str) -> AsyncEngine:
    if db_url not in _engines:
        _engines[db_url] = create_async_engine(
            db_url,
            echo=False,
            pool_size=2,
            max_overflow=5,
        )
    return _engines[db_url]


async def assert_schema_exists(db_url: str):
    from database import Base
    engine = get_or_create_engine(db_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def get_session_factory(db_url: str) -> async_sessionmaker[AsyncSession]:
    if db_url not in _factories:
        engine = get_or_create_engine(db_url)
        _factories[db_url] = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return _factories[db_url]


def generate_schema_sql() -> str:
    from database import Base
    from sqlalchemy.schema import CreateTable
    lines = []
    for table in Base.metadata.sorted_tables:
        stmt = str(CreateTable(table).compile(compile_kwargs={"literal_binds": True}))
        lines.append(stmt)
        lines.append("")
    return "\n".join(lines)
