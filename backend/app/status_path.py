"""Canonical pipeline every application is treated as having travelled.

An application is always submitted, so its history starts at ``applied`` and
moves through ``phone_screen`` and ``technical`` before ending at ``offer`` or
``rejected``. Recording the whole path up to the current status keeps the
journey Sankey consistent with the tracker totals, even when data is imported
or created at a later stage.
"""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, StatusEvent

PIPELINE: tuple[str, ...] = ("applied", "phone_screen", "technical")
TERMINAL: tuple[str, ...] = ("offer", "rejected")

Transition = tuple[str | None, str]


def status_path(status: str) -> tuple[str, ...]:
    """Stages an application at ``status`` has passed through, in order."""
    if status in PIPELINE:
        return PIPELINE[: PIPELINE.index(status) + 1]
    if status in TERMINAL:
        return (*PIPELINE, status)
    return (PIPELINE[0],)


def path_transitions(status: str) -> list[Transition]:
    """``(from, to)`` pairs for the full path, starting with ``(None, "applied")``."""
    path = status_path(status)
    return list(zip((None, *path), path))


def transitions_between(old: str, new: str) -> list[Transition]:
    """Transitions to record when an application moves from ``old`` to ``new``.

    Moving forward along the pipeline fills in every intermediate stage; any
    other move (backwards, out of a terminal state) is a single transition.
    """
    old_path, new_path = status_path(old), status_path(new)
    is_forward = (
        old != new
        and old in (*PIPELINE, *TERMINAL)
        and new_path[: len(old_path)] == old_path
    )
    if is_forward:
        return list(zip(new_path[len(old_path) - 1 :], new_path[len(old_path) :]))
    return [(old, new)]


def path_events(application_id: int, status: str) -> list[StatusEvent]:
    return [
        StatusEvent(application_id=application_id, from_status=src, to_status=dst)
        for src, dst in path_transitions(status)
    ]


async def backfill_status_paths(db: AsyncSession) -> int:
    """Rebuild events for applications whose history isn't the canonical path.

    Idempotent: applications that already match are left untouched. Returns the
    number of applications rewritten.
    """
    apps = (await db.execute(select(Application))).scalars().all()
    events = (await db.execute(select(StatusEvent))).scalars().all()

    pairs_by_app: dict[int, set[Transition]] = {}
    for e in events:
        pairs_by_app.setdefault(e.application_id, set()).add((e.from_status, e.to_status))

    rewritten = 0
    for app in apps:
        existing = pairs_by_app.get(app.id, set())
        if existing == set(path_transitions(app.status)):
            continue
        await db.execute(delete(StatusEvent).where(StatusEvent.application_id == app.id))
        db.add_all(path_events(app.id, app.status))
        rewritten += 1

    if rewritten:
        await db.commit()
    return rewritten
