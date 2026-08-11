from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def build_db_url(connection_string: str) -> str:
    if connection_string.startswith("postgresql+asyncpg://"):
        return connection_string
    if connection_string.startswith("postgresql://"):
        return connection_string.replace("postgresql://", "postgresql+asyncpg://", 1)
    if connection_string.startswith("postgres://"):
        return connection_string.replace("postgres://", "postgresql+asyncpg://", 1)
    raise ValueError("Invalid PostgreSQL connection string. Must start with postgresql:// or postgres://")


async def validate_connection(connection_string: str) -> bool:
    db_url = build_db_url(connection_string)
    engine = create_async_engine(db_url, echo=False)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        await engine.dispose()
