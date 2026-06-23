"""Integration tests for /profile routes."""

import pytest

pytestmark = pytest.mark.asyncio


async def test_get_profile_creates_if_missing(client):
    resp = await client.get("/profile")
    assert resp.status_code == 200
    body = resp.json()
    assert "id" in body
    assert body["linkedin_url"] is None
    assert body["github_url"] is None


async def test_get_profile_idempotent(client):
    resp1 = await client.get("/profile")
    resp2 = await client.get("/profile")
    assert resp1.json()["id"] == resp2.json()["id"]


async def test_update_profile_linkedin(client):
    await client.get("/profile")
    resp = await client.put("/profile", json={"linkedin_url": "https://linkedin.com/in/test"})
    assert resp.status_code == 200
    assert resp.json()["linkedin_url"] == "https://linkedin.com/in/test"


async def test_update_profile_partial(client):
    await client.get("/profile")
    await client.put("/profile", json={"linkedin_url": "https://linkedin.com/in/test"})
    resp = await client.put("/profile", json={"github_url": "https://github.com/test"})
    body = resp.json()
    assert body["linkedin_url"] == "https://linkedin.com/in/test"
    assert body["github_url"] == "https://github.com/test"
