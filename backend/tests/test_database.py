from app.database import _to_asyncpg_url


def test_rewrites_postgres_scheme():
    assert _to_asyncpg_url("postgres://u:p@host:5432/db") == "postgresql+asyncpg://u:p@host:5432/db"


def test_rewrites_postgresql_scheme():
    assert _to_asyncpg_url("postgresql://u:p@host:5432/db") == "postgresql+asyncpg://u:p@host:5432/db"


def test_leaves_already_correct_scheme_untouched():
    url = "postgresql+asyncpg://u:p@host:5432/db"
    assert _to_asyncpg_url(url) == url


def test_leaves_sqlite_untouched():
    url = "sqlite+aiosqlite:///:memory:"
    assert _to_asyncpg_url(url) == url


def test_strips_sslmode_which_asyncpg_rejects():
    result = _to_asyncpg_url("postgres://u:p@host:5432/db?sslmode=require")
    assert "sslmode" not in result
    assert result == "postgresql+asyncpg://u:p@host:5432/db"


def test_keeps_other_query_params_while_stripping_sslmode():
    result = _to_asyncpg_url("postgres://u:p@host:5432/db?sslmode=require&application_name=job-assistant")
    assert "sslmode" not in result
    assert "application_name=job-assistant" in result
