"""Canonical pipeline every application is treated as having travelled.

An application is always submitted, so its history starts at ``applied`` and
moves through ``phone_screen`` and ``technical`` before ending at ``offer`` or
``rejected``. Recording the whole path up to the current status keeps the
journey Sankey consistent with the tracker totals, even when data is imported
or created at a later stage.
"""

from sqlalchemy import delete, func, select
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
    other move (backwards, out of a terminal state, or from an unknown legacy
    status) is a single transition. Moving to the same status is a no-op.
    """
    if old == new:
        return []
    old_path, new_path = status_path(old), status_path(new)
    is_forward = (
        old in (*PIPELINE, *TERMINAL)
        and new_path[: len(old_path)] == old_path
    )
    if is_forward:
        return list(zip(new_path[len(old_path) - 1 :], new_path[len(old_path) :]))
    return [(old, new)]


def path_events(application_id: int, status: str) -> list[StatusEvent]:
    """New ``StatusEvent`` rows for the full canonical path up to ``status``."""
    return [
        StatusEvent(application_id=application_id, from_status=src, to_status=dst)
        for src, dst in path_transitions(status)
    ]


# Arbitrary constant; serialises concurrent backfills across workers on Postgres.
_BACKFILL_LOCK_KEY = 7_301_992


async def backfill_status_paths(db: AsyncSession) -> int:
    """Repair applications whose history never starts at ``applied``.

    Legacy imports recorded a single ``None -> <current stage>`` event, so they
    are missing from the Sankey. Only those applications are rewritten with the
    canonical path; any application that already starts at ``applied`` keeps its
    real history (including backward moves and corrections), so this is a no-op
    once the legacy rows are fixed. Returns the number of applications rewritten.
    """
    try:
        if db.bind is not None and db.bind.dialect.name == "postgresql":
            await db.execute(select(func.pg_advisory_xact_lock(_BACKFILL_LOCK_KEY)))

        started = set(
            (
                await db.execute(
                    select(StatusEvent.application_id).where(
                        StatusEvent.from_status.is_(None),
                        StatusEvent.to_status == PIPELINE[0],
                    )
                )
            ).scalars()
        )
        rows = (await db.execute(select(Application.id, Application.status))).all()
        broken = [(app_id, status) for app_id, status in rows if app_id not in started]
        if not broken:
            return 0

        await db.execute(
            delete(StatusEvent).where(StatusEvent.application_id.in_([i for i, _ in broken]))
        )
        for app_id, status in broken:
            db.add_all(path_events(app_id, status))
        await db.commit()
        return len(broken)
    except Exception:
        await db.rollback()
        raise
