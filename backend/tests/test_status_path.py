"""Every application flows through the full pipeline in the journey Sankey."""

from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models import Application, StatusEvent
from app.status_path import (
    backfill_status_paths,
    path_transitions,
    status_path,
    transitions_between,
)

CSV_HEADER = "Company\tRole\tStage\tDate\n"


def test_status_path_per_stage():
    assert status_path("applied") == ("applied",)
    assert status_path("technical") == ("applied", "phone_screen", "technical")
    assert status_path("offer") == ("applied", "phone_screen", "technical", "offer")
    assert status_path("rejected")[-1] == "rejected"


def test_path_transitions_start_with_creation_event():
    assert path_transitions("phone_screen") == [
        (None, "applied"),
        ("applied", "phone_screen"),
    ]


def test_transitions_between_fills_intermediate_stages():
    assert transitions_between("applied", "technical") == [
        ("applied", "phone_screen"),
        ("phone_screen", "technical"),
    ]
    assert transitions_between("technical", "rejected") == [("technical", "rejected")]


def test_transitions_between_same_status_is_noop():
    assert transitions_between("applied", "applied") == []


def test_transitions_between_backwards_or_from_terminal_is_single():
    assert transitions_between("technical", "applied") == [("technical", "applied")]
    assert transitions_between("offer", "rejected") == [("offer", "rejected")]


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
    # All three enter at "applied": one stays there, two move on.
    assert links[("applied", "active")] == 1
    assert links[("applied", "phone_screen")] == 2
    assert links[("technical", "rejected")] == 1
    assert links[("technical", "offer")] == 1


@pytest.mark.asyncio
async def test_create_at_later_stage_seeds_full_path(client):
    await client.post(
        "/applications",
        json={"company": "X", "role": "Y", "job_description": "d", "status": "technical"},
    )
    links = await _links(client)
    assert links == {
        ("applied", "phone_screen"): 1,
        ("phone_screen", "technical"): 1,
        ("technical", "active"): 1,
    }


@pytest.mark.asyncio
async def test_update_skipping_stages_fills_them_in(client):
    created = (
        await client.post(
            "/applications", json={"company": "X", "role": "Y", "job_description": "d"}
        )
    ).json()
    await client.put(f"/applications/{created['id']}", json={"status": "rejected"})
    links = await _links(client)
    assert links == {
        ("applied", "phone_screen"): 1,
        ("phone_screen", "technical"): 1,
        ("technical", "rejected"): 1,
    }


@pytest.mark.asyncio
async def test_backward_update_is_a_single_transition(client):
    created = (
        await client.post(
            "/applications",
            json={"company": "X", "role": "Y", "job_description": "d", "status": "technical"},
        )
    ).json()
    await client.put(f"/applications/{created['id']}", json={"status": "applied"})
    await client.put(f"/applications/{created['id']}", json={"status": "applied"})
    links = await _links(client)
    assert links[("technical", "applied")] == 1


async def _legacy_app(db_session, status: str) -> Application:
    legacy = Application(company="L", role="R", status=status, job_description="")
    db_session.add(legacy)
    await db_session.flush()
    # What the old CSV import wrote: one creation event at the final stage.
    db_session.add(StatusEvent(application_id=legacy.id, from_status=None, to_status=status))
    await db_session.commit()
    return legacy


@pytest.mark.asyncio
async def test_backfill_repairs_legacy_events_and_is_idempotent(db_session):
    await _legacy_app(db_session, "rejected")

    assert await backfill_status_paths(db_session) == 1
    assert await backfill_status_paths(db_session) == 0

    events = (await db_session.execute(select(StatusEvent))).scalars().all()
    assert {(e.from_status, e.to_status) for e in events} == set(path_transitions("rejected"))


@pytest.mark.asyncio
async def test_backfill_preserves_healthy_history(db_session):
    app = Application(company="H", role="R", status="applied", job_description="")
    db_session.add(app)
    await db_session.flush()
    # Real history with a backward move: applied -> technical -> applied.
    stamp = datetime(2026, 1, 5, 12, 0, 0)
    history = [(None, "applied"), ("applied", "technical"), ("technical", "applied")]
    db_session.add_all(
        StatusEvent(application_id=app.id, from_status=a, to_status=b, changed_at=stamp)
        for a, b in history
    )
    await db_session.commit()
    await _legacy_app(db_session, "offer")

    assert await backfill_status_paths(db_session) == 1  # only the legacy app

    kept = (
        await db_session.execute(select(StatusEvent).where(StatusEvent.application_id == app.id))
    ).scalars().all()
    assert {(e.from_status, e.to_status) for e in kept} == set(history)
    assert all(e.changed_at == stamp for e in kept)
