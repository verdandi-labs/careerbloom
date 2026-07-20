from uuid import UUID
from sqlalchemy import make_url
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession, AsyncEngine
from sqlalchemy.orm import DeclarativeBase
from config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    pass


class DatabaseRouter:
    _engines: dict[str, AsyncEngine] = {}
    _factories: dict[str, async_sessionmaker[AsyncSession]] = {}

    def get_engine(self, db_url: str) -> AsyncEngine:
        if not db_url:
            db_url = settings.NEON_DATABASE_URL
        if db_url not in self._engines:
            url = make_url(db_url)
            url = url._replace(query={}, drivername="postgresql+asyncpg")
            self._engines[db_url] = create_async_engine(
                url,
                echo=False,
                pool_size=5,
                max_overflow=10,
                connect_args={"ssl": True},
            )
        return self._engines[db_url]

    def get_factory(self, db_url: str) -> async_sessionmaker[AsyncSession]:
        if db_url not in self._factories:
            engine = self.get_engine(db_url)
            self._factories[db_url] = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        return self._factories[db_url]

    async def dispose_all(self):
        for engine in self._engines.values():
            await engine.dispose()
        self._engines.clear()
        self._factories.clear()


router = DatabaseRouter()

global_engine = router.get_engine(settings.NEON_DATABASE_URL)
global_session_factory = router.get_factory(settings.NEON_DATABASE_URL)


async def get_db():
    async with global_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_db_for_user(db_url: str):
    factory = router.get_factory(db_url)

    async def _get_db():
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    return _get_db
