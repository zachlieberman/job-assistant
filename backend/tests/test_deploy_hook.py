"""Deploy hook: debounced rebuild after portfolio edits."""

import asyncio

import pytest

from app.services import deploy_hook

HOOK = "https://api.vercel.com/v1/integrations/deploy/prj_x/abc"


@pytest.fixture(autouse=True)
def _hook_env(monkeypatch):
    monkeypatch.setenv("VERCEL_DEPLOY_HOOK_URL", HOOK)
    monkeypatch.setenv("REBUILD_DEBOUNCE_SECONDS", "0.05")
    deploy_hook._pending = None
    yield
    if deploy_hook._pending is not None:
        deploy_hook._pending.cancel()
    deploy_hook._pending = None


@pytest.fixture
def posted(monkeypatch):
    calls: list[str] = []
    monkeypatch.setattr(deploy_hook, "_post", lambda url: calls.append(url) or 201)
    return calls


async def _settle():
    await asyncio.sleep(0.25)


async def test_burst_of_edits_triggers_one_rebuild(posted):
    for _ in range(3):
        deploy_hook.schedule_rebuild()
        await asyncio.sleep(0.01)
    await _settle()
    assert posted == [HOOK]


async def test_separate_edits_each_trigger_a_rebuild(posted):
    deploy_hook.schedule_rebuild()
    await _settle()
    deploy_hook.schedule_rebuild()
    await _settle()
    assert posted == [HOOK, HOOK]


async def test_no_hook_configured_is_a_noop(monkeypatch, posted):
    monkeypatch.delenv("VERCEL_DEPLOY_HOOK_URL")
    deploy_hook.schedule_rebuild()
    await _settle()
    assert posted == []


async def test_non_https_hook_is_ignored(monkeypatch, posted):
    monkeypatch.setenv("VERCEL_DEPLOY_HOOK_URL", "http://insecure.example/hook")
    deploy_hook.schedule_rebuild()
    await _settle()
    assert posted == []


async def test_failing_hook_is_logged_not_raised(monkeypatch, caplog):
    def boom(url):
        raise OSError("network down")

    monkeypatch.setattr(deploy_hook, "_post", boom)
    deploy_hook.schedule_rebuild()
    await _settle()
    assert "Could not trigger public site rebuild" in caplog.text
    assert HOOK not in caplog.text


async def test_invalid_debounce_falls_back_to_default(monkeypatch):
    monkeypatch.setenv("REBUILD_DEBOUNCE_SECONDS", "soon")
    assert deploy_hook._debounce_seconds() == 60.0


BIO = {"title": "Engineer"}
PROJECT = {"name": "P", "description": "d", "tags": [], "sort_order": 0}
JOB = {"role": "R", "company": "C", "period": "2020", "bullets": [], "sort_order": 0}


async def test_successful_writes_schedule_a_rebuild(client, monkeypatch):
    scheduled = []
    monkeypatch.setattr(deploy_hook, "schedule_rebuild", lambda: scheduled.append(1))

    assert (await client.put("/portfolio/bio", json=BIO)).status_code == 200
    project = (await client.post("/portfolio/projects", json=PROJECT)).json()
    assert (await client.put(f"/portfolio/projects/{project['id']}", json={"name": "P2"})).status_code == 200
    assert (await client.delete(f"/portfolio/projects/{project['id']}")).status_code == 204
    job = (await client.post("/portfolio/experience", json=JOB)).json()
    assert (await client.put(f"/portfolio/experience/{job['id']}", json={"role": "R2"})).status_code == 200
    assert (await client.delete(f"/portfolio/experience/{job['id']}")).status_code == 204

    assert len(scheduled) == 7


async def test_failed_writes_and_reads_do_not_schedule(client, monkeypatch):
    scheduled = []
    monkeypatch.setattr(deploy_hook, "schedule_rebuild", lambda: scheduled.append(1))

    assert (await client.put("/portfolio/projects/999", json={"name": "x"})).status_code == 404
    assert (await client.delete("/portfolio/experience/999")).status_code == 404
    assert (await client.get("/portfolio/bio")).status_code == 200
    assert (await client.get("/portfolio/projects")).status_code == 200

    assert scheduled == []


async def test_unauthenticated_write_does_not_schedule(unauthenticated_client, monkeypatch):
    scheduled = []
    monkeypatch.setattr(deploy_hook, "schedule_rebuild", lambda: scheduled.append(1))
    assert (await unauthenticated_client.put("/portfolio/bio", json=BIO)).status_code == 401
    assert scheduled == []
