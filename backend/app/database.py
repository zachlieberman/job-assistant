from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import os

load_dotenv()


def _to_asyncpg_url(url: str) -> str:
    """Railway (and most managed Postgres providers) hand out a plain
    postgres:// or postgresql:// URL; SQLAlchemy's async engine needs the
    asyncpg driver scheme. Leaves other schemes (e.g. sqlite in tests) untouched.
    """
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    else:
        return url

    # asyncpg doesn't understand the libpq `sslmode` query param that some
    # managed Postgres providers append — it raises a TypeError on connect
    # if it's present, so strip it rather than let the app crash at startup.
    parts = urlsplit(url)
    query = urlencode([(k, v) for k, v in parse_qsl(parts.query) if k != "sslmode"])
    return urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


DATABASE_URL = _to_asyncpg_url(os.environ["DATABASE_URL"])

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        from app.models import Application  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
