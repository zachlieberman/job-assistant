"""Integration tests for /events click tracking routes."""

from datetime import datetime, timedelta, timezone

import pytest

from app.models import ClickEvent
from app.routes import events

pytestmark = pytest.mark.asyncio

KEY = {"X-Stats-Key": "test-stats-key"}


@pytest.fixture(autouse=True)
def _stats_key_and_clean_limiter(monkeypatch):
    monkeypatch.setenv("STATS_API_KEY", "test-stats-key")
    events._recent_clicks.clear()
    yield
    events._recent_clicks.clear()


async def test_record_click_stores_event(client, db_session):
    resp = await client.post("/events/click", json={"target": "resume", "page": "/"})
    assert resp.status_code == 204
    rows = (await db_session.execute(ClickEvent.__table__.select())).all()
    assert len(rows) == 1
    assert rows[0].target == "resume"
    assert rows[0].page == "/"


async def test_record_click_rejects_unknown_target(client):
    resp = await client.post("/events/click", json={"target": "evil", "page": "/"})
    assert resp.status_code == 422


async def test_record_click_rejects_oversized_page(client):
    resp = await client.post("/events/click", json={"target": "email", "page": "x" * 500})
    assert resp.status_code == 422


async def test_record_click_is_globally_rate_limited(client, monkeypatch):
    monkeypatch.setattr(events, "MAX_CLICKS_PER_MINUTE", 2)
    for _ in range(2):
        assert (await client.post("/events/click", json={"target": "github", "page": "/"})).status_code == 204
    resp = await client.post("/events/click", json={"target": "github", "page": "/"})
    assert resp.status_code == 429


async def test_summary_requires_key(client):
    assert (await client.get("/events/summary?date=2026-10-01")).status_code == 401
    assert (
        await client.get("/events/summary?date=2026-10-01", headers={"X-Stats-Key": "wrong"})
    ).status_code == 401


async def test_summary_disabled_without_configured_key(client, monkeypatch):
    monkeypatch.delenv("STATS_API_KEY", raising=False)
    resp = await client.get("/events/summary?date=2026-10-01", headers={"X-Stats-Key": ""})
    assert resp.status_code == 401


async def test_summary_counts_by_day_and_target(client, db_session):
    day = datetime(2026, 10, 1, 12, tzinfo=timezone.utc)
    other = day + timedelta(days=1)
    for target, when in [
        ("resume", day), ("resume", day), ("email", day), ("linkedin", day),
        ("github", other), ("resume", other),
    ]:
        db_session.add(ClickEvent(target=target, page="/", created_at=when.replace(tzinfo=None)))
    await db_session.commit()

    resp = await client.get("/events/summary?date=2026-10-01", headers=KEY)
    assert resp.status_code == 200
    assert resp.json() == {
        "date": "2026-10-01", "resume": 2, "email": 1, "linkedin": 1, "github": 0, "contact": 2,
    }


async def test_summary_rejects_bad_date(client):
    resp = await client.get("/events/summary?date=not-a-date", headers=KEY)
    assert resp.status_code == 422
