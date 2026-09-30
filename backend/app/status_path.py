"""Status history recorded for each application.

Every application was submitted, so its history starts at ``applied``. An
application created or imported at a later stage only records what is known:
``applied`` straight to its current status. Intermediate stages are never
invented; they appear only when the application is actually moved through them.
"""

from collections import defaultdict
from datetime import datetime

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Application, StatusEvent

START_STATUS = "applied"

Transition = tuple[str | None, str]

# Earlier status names and what they became.
LEGACY_STATUS_RENAMES: dict[str, str] = {
    "phone_screen": "recruiter_screen",
    "technical": "interview",
}

# Stages an earlier version invented for apps created or imported past "applied"
# (under the old stage names; see LEGACY_STATUS_RENAMES).
_INVENTED_PIPELINE: tuple[str, ...] = ("applied", "phone_screen", "technical")
_INVENTED_TERMINAL: tuple[str, ...] = ("offer", "rejected")

# Arbitrary constant; serialises concurrent backfills across workers on Postgres.
_BACKFILL_LOCK_KEY = 7_301_992


def path_transitions(status: str) -> list[Transition]:
    """Known history for an application first seen at ``status``."""
    if status == START_STATUS:
        return [(None, START_STATUS)]
    return [(None, START_STATUS), (START_STATUS, status)]


def path_events(application_id: int, status: str) -> list[StatusEvent]:
    """New ``StatusEvent`` rows for ``path_transitions(status)``."""
    return [
        StatusEvent(application_id=application_id, from_status=src, to_status=dst)
        for src, dst in path_transitions(status)
    ]


def _invented_transitions(status: str) -> set[Transition]:
    """The full applied -> ... -> ``status`` path an earlier version wrote."""
    if status in _INVENTED_PIPELINE:
        path = _INVENTED_PIPELINE[: _INVENTED_PIPELINE.index(status) + 1]
    elif status in _INVENTED_TERMINAL:
        path = (*_INVENTED_PIPELINE, status)
    else:
        path = (START_STATUS,)
    return set(zip((None, *path), path))


def _is_invented(status: str, events: list[tuple[Transition, datetime]]) -> bool:
    """True for the stage-by-stage path written in one go by the earlier version.

    Real history is recorded one move at a time, so its events have distinct
    timestamps; the invented path was inserted in a single transaction.
    """
    stamps = {stamp for _, stamp in events}
    pairs = {pair for pair, _ in events}
    return len(events) >= 3 and len(stamps) == 1 and pairs == _invented_transitions(status)


async def migrate_legacy_statuses(db: AsyncSession) -> int:
    """Rename old stage names on applications and their events (idempotent).

    Run after ``backfill_status_paths``, which recognises the old names.
    Returns the number of application rows renamed.
    """
    try:
        renamed = 0
        for old, new in LEGACY_STATUS_RENAMES.items():
            result = await db.execute(
                update(Application).where(Application.status == old).values(status=new)
            )
            renamed += result.rowcount or 0
            await db.execute(
                update(StatusEvent).where(StatusEvent.from_status == old).values(from_status=new)
            )
            await db.execute(
                update(StatusEvent).where(StatusEvent.to_status == old).values(to_status=new)
            )
        await db.commit()
        return renamed
    except Exception:
        await db.rollback()
        raise


async def backfill_status_paths(db: AsyncSession) -> int:
    """Repair applications whose recorded history misrepresents their journey.

    Two cases are rewritten with ``path_transitions``: legacy imports whose
    history never starts at ``applied``, and apps carrying the invented
    stage-by-stage path. Real history (including backward moves and
    corrections) is left untouched, so this is a no-op once repaired. Returns
    the number of applications rewritten.
    """
    try:
        if db.bind is not None and db.bind.dialect.name == "postgresql":
            await db.execute(select(func.pg_advisory_xact_lock(_BACKFILL_LOCK_KEY)))

        events: dict[int, list[tuple[Transition, datetime]]] = defaultdict(list)
        rows = await db.execute(
            select(
                StatusEvent.application_id,
                StatusEvent.from_status,
                StatusEvent.to_status,
                StatusEvent.changed_at,
            )
        )
        for app_id, src, dst, stamp in rows:
            events[app_id].append(((src, dst), stamp))

        apps = (await db.execute(select(Application.id, Application.status))).all()
        broken = [
            (app_id, status)
            for app_id, status in apps
            if (None, START_STATUS) not in {pair for pair, _ in events.get(app_id, [])}
            or _is_invented(status, events[app_id])
        ]
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
