"""The journey Sankey records only the history that is actually known."""

from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models import Application, StatusEvent
from app.status_path import backfill_status_paths, migrate_legacy_statuses, path_transitions

CSV_HEADER = "Company\tRole\tStage\tDate\n"


def test_path_transitions_for_applied():
    assert path_transitions("applied") == [(None, "applied")]


@pytest.mark.parametrize("status", ["recruiter_screen", "interview", "final_interview", "offer", "rejected"])
def test_path_transitions_go_straight_from_applied(status):
    assert path_transitions(status) == [(None, "applied"), ("applied", status)]


async def _links(client: AsyncClient) -> dict[tuple[str, str], int]:
    body = (await client.get("/applications/sankey-data")).json()
    names = [n["name"] for n in body["nodes"]]
    return {(names[link["source"]], names[link["target"]]): link["value"] for link in body["links"]}


@pytest.mark.asyncio
async def test_csv_import_counts_every_application_as_applied(client):
    rows = "A\tEng\tapplied\t1/1/2026\nB\tEng\trejected\t1/2/2026\nC\tEng\toffer\t1/3/2026\n"
    resp = await client.post(
        "/applications/import-csv",
        files={"file": ("a.csv", CSV_HEADER + rows, "text/csv")},
    )
    assert resp.json()["imported"] == 3
    links = await _links(client)
    assert links == {
        ("applied", "active"): 1,
        ("applied", "rejected"): 1,
        ("applied", "offer"): 1,
    }


@pytest.mark.asyncio
async def test_create_at_later_stage_does_not_invent_stages(client):
    await client.post(
        "/applications",
        json={"company": "X", "role": "Y", "job_description": "d", "status": "interview"},
    )
    assert await _links(client) == {("applied", "interview"): 1, ("interview", "active"): 1}


@pytest.mark.asyncio
async def test_update_records_a_single_transition(client):
    created = (
        await client.post(
            "/applications", json={"company": "X", "role": "Y", "job_description": "d"}
        )
    ).json()
    await client.put(f"/applications/{created['id']}", json={"status": "recruiter_screen"})
    await client.put(f"/applications/{created['id']}", json={"status": "rejected"})
    await client.put(f"/applications/{created['id']}", json={"status": "rejected"})
    assert await _links(client) == {
        ("applied", "recruiter_screen"): 1,
        ("recruiter_screen", "rejected"): 1,
    }


async def _app_with_events(db_session, status: str, events: list, stamps=None) -> Application:
    app = Application(company="A", role="R", status=status, job_description="")
    db_session.add(app)
    await db_session.flush()
    for i, (src, dst) in enumerate(events):
        stamp = stamps[i] if stamps else datetime(2026, 1, 1)
        db_session.add(
            StatusEvent(application_id=app.id, from_status=src, to_status=dst, changed_at=stamp)
        )
    await db_session.commit()
    return app


async def _pairs(db_session, app_id: int) -> set:
    rows = await db_session.execute(select(StatusEvent).where(StatusEvent.application_id == app_id))
    return {(e.from_status, e.to_status) for e in rows.scalars()}


@pytest.mark.asyncio
async def test_backfill_repairs_legacy_single_event(db_session):
    app = await _app_with_events(db_session, "rejected", [(None, "rejected")])
    assert await backfill_status_paths(db_session) == 1
    assert await _pairs(db_session, app.id) == {(None, "applied"), ("applied", "rejected")}
    assert await backfill_status_paths(db_session) == 0


@pytest.mark.asyncio
async def test_backfill_undoes_invented_full_path(db_session):
    invented = [
        (None, "applied"),
        ("applied", "phone_screen"),
        ("phone_screen", "technical"),
        ("technical", "rejected"),
    ]
    app = await _app_with_events(db_session, "rejected", invented)
    assert await backfill_status_paths(db_session) == 1
    assert await _pairs(db_session, app.id) == {(None, "applied"), ("applied", "rejected")}
    assert await backfill_status_paths(db_session) == 0


@pytest.mark.asyncio
async def test_backfill_keeps_real_history_even_with_full_path(db_session):
    """A genuine full path is recorded move by move, so timestamps differ."""
    path = [
        (None, "applied"),
        ("applied", "phone_screen"),
        ("phone_screen", "technical"),
        ("technical", "rejected"),
    ]
    stamps = [datetime(2026, 1, d) for d in (1, 5, 12, 20)]
    app = await _app_with_events(db_session, "rejected", path, stamps)
    assert await backfill_status_paths(db_session) == 0
    assert await _pairs(db_session, app.id) == set(path)


@pytest.mark.asyncio
async def test_backfill_keeps_backward_moves(db_session):
    history = [(None, "applied"), ("applied", "technical"), ("technical", "applied")]
    app = await _app_with_events(db_session, "applied", history)
    assert await backfill_status_paths(db_session) == 0
    assert await _pairs(db_session, app.id) == set(history)


@pytest.mark.asyncio
async def test_migrate_legacy_statuses_renames_apps_and_events(db_session):
    history = [(None, "applied"), ("applied", "phone_screen"), ("phone_screen", "technical")]
    stamps = [datetime(2026, 1, d) for d in (1, 5, 12)]
    app = await _app_with_events(db_session, "technical", history, stamps)

    assert await migrate_legacy_statuses(db_session) == 1
    assert await migrate_legacy_statuses(db_session) == 0

    await db_session.refresh(app)
    assert app.status == "interview"
    assert await _pairs(db_session, app.id) == {
        (None, "applied"),
        ("applied", "recruiter_screen"),
        ("recruiter_screen", "interview"),
    }


@pytest.mark.asyncio
async def test_invented_path_is_undone_before_rename(db_session):
    """Startup order: the backfill recognises old names, then they are renamed."""
    invented = [
        (None, "applied"),
        ("applied", "phone_screen"),
        ("phone_screen", "technical"),
        ("technical", "rejected"),
    ]
    app = await _app_with_events(db_session, "rejected", invented)
    await backfill_status_paths(db_session)
    await migrate_legacy_statuses(db_session)
    assert await _pairs(db_session, app.id) == {(None, "applied"), ("applied", "rejected")}


@pytest.mark.asyncio
async def test_csv_import_maps_new_and_legacy_stage_names(client):
    rows = (
        "A\tEng\tRecruiter Screen\t1/1/2026\n"
        "B\tEng\tphone screen\t1/1/2026\n"
        "C\tEng\tInterview 2\t1/1/2026\n"
        "D\tEng\tTechnical\t1/1/2026\n"
        "E\tEng\tFinal Interview\t1/1/2026\n"
        "F\tEng\tNo Offer\t1/1/2026\n"
    )
    await client.post(
        "/applications/import-csv",
        files={"file": ("a.csv", CSV_HEADER + rows, "text/csv")},
    )
    statuses = sorted(a["status"] for a in (await client.get("/applications")).json())
    assert statuses == sorted(
        ["recruiter_screen", "recruiter_screen", "interview", "interview", "final_interview", "rejected"]
    )
