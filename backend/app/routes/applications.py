import csv
import io
from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models import Application, StatusEvent
from app.schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationStatus

STATUS_CHAIN: list[str] = ["applied", "phone_screen", "technical", "offer"]

def _status_events_for(app_id: int, final_status: str) -> list[StatusEvent]:
    """Return StatusEvent records reconstructing the implied journey to final_status."""
    chain = STATUS_CHAIN if final_status != "rejected" else STATUS_CHAIN[:1]
    stop_at = final_status if final_status != "rejected" else "applied"

    events: list[StatusEvent] = []
    prev: str | None = None
    for step in chain:
        events.append(StatusEvent(application_id=app_id, from_status=prev, to_status=step))
        prev = step
        if step == stop_at:
            break

    if final_status == "rejected":
        events.append(StatusEvent(application_id=app_id, from_status="applied", to_status="rejected"))

    return events


CSV_STATUS_MAP: dict[str, str] = {
    "applied": "applied",
    "phone screen": "phone_screen",
    "phone_screen": "phone_screen",
    "technical": "technical",
    "technical interview": "technical",
    "offer": "offer",
    "rejected": "rejected",
    "other": "applied",
    "": "applied",
}


def _parse_csv_date(raw: str) -> date:
    raw = raw.strip()
    for fmt in ("%m/%d/%Y", "%Y-%m-%d", "%m-%d-%Y"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return date.today()


router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=List[ApplicationResponse])
async def list_applications(
    status: Optional[ApplicationStatus] = Query(None),
    company: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Application).order_by(Application.created_at.desc())
    if status:
        stmt = stmt.where(Application.status == status)
    if company:
        stmt = stmt.where(Application.company.ilike(f"%{company}%"))
    result = await db.execute(stmt)
    return result.scalars().all()


TERMINAL_STATUSES = {"offer", "rejected"}

@router.get("/sankey-data")
async def get_sankey_data(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StatusEvent))
    events = result.scalars().all()

    # Count transitions between real statuses (skip creation events)
    flow_counts: dict[tuple[str, str], int] = {}
    entered: dict[str, int] = {}
    for e in events:
        entered[e.to_status] = entered.get(e.to_status, 0) + 1
        if e.from_status is None:
            continue
        key = (e.from_status, e.to_status)
        flow_counts[key] = flow_counts.get(key, 0) + 1

    # For non-terminal statuses, apps that entered but never transitioned out
    # need an "Active" sink so the node value reflects the full count
    exited: dict[str, int] = {}
    for (src, _), count in flow_counts.items():
        exited[src] = exited.get(src, 0) + count

    for status, count in entered.items():
        if status in TERMINAL_STATUSES:
            continue
        remaining = count - exited.get(status, 0)
        if remaining > 0:
            flow_counts[(status, "active")] = flow_counts.get((status, "active"), 0) + remaining

    if not flow_counts:
        return {"nodes": [], "links": []}

    all_nodes: list[str] = []
    seen: set[str] = set()
    for src, dst in flow_counts:
        for n in (src, dst):
            if n not in seen:
                all_nodes.append(n)
                seen.add(n)

    node_index = {n: i for i, n in enumerate(all_nodes)}
    links = [
        {"source": node_index[src], "target": node_index[dst], "value": count}
        for (src, dst), count in flow_counts.items()
    ]

    return {"nodes": [{"name": n} for n in all_nodes], "links": links}


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    payload: ApplicationCreate, db: AsyncSession = Depends(get_db)
):
    app = Application(**payload.model_dump())
    db.add(app)
    await db.flush()
    db.add(StatusEvent(application_id=app.id, from_status=None, to_status=app.status))
    await db.commit()
    await db.refresh(app)
    return app


@router.get("/{app_id}", response_model=ApplicationResponse)
async def get_application(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: int, payload: ApplicationUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    old_status = app.status
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(app, field, value)
    if payload.status and payload.status != old_status:
        db.add(StatusEvent(application_id=app.id, from_status=old_status, to_status=payload.status))
    await db.commit()
    await db.refresh(app)
    return app


@router.delete("/{app_id}", status_code=204)
async def delete_application(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    await db.commit()


class CsvImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


@router.post("/import-csv", response_model=CsvImportResult)
async def import_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handles BOM from Excel exports
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")

    # detect delimiter: try tab first, fall back to comma if it yields only one field
    tab_reader = csv.DictReader(io.StringIO(text), delimiter="\t")
    tab_fields = tab_reader.fieldnames or []
    if len(tab_fields) > 1:
        reader = tab_reader
    else:
        reader = csv.DictReader(io.StringIO(text))

    imported = 0
    skipped = 0
    errors: List[str] = []

    for i, row in enumerate(reader, start=2):  # row 1 is header
        company = (row.get("Company") or "").strip()
        role = (row.get("Role") or "").strip()

        if not company:
            skipped += 1
            errors.append(f"Row {i}: missing Company, skipped")
            continue

        if not role:
            role = "N/A"

        raw_status = (row.get("Stage") or "").strip().lower()
        status = CSV_STATUS_MAP.get(raw_status, "applied")

        raw_date = (row.get("Date") or "").strip()
        applied_date = _parse_csv_date(raw_date) if raw_date else date.today()

        app = Application(
            company=company,
            role=role,
            status=status,
            date_applied=applied_date,
            job_url=(row.get("Job Posting Link") or "").strip() or None,
            job_description="",
            notes=(row.get("Notes") or "").strip() or None,
            location=(row.get("Location") or "").strip() or None,
            salary_range=(row.get("Salary Range") or "").strip() or None,
        )
        db.add(app)
        await db.flush()
        for event in _status_events_for(app.id, status):
            db.add(event)
        imported += 1

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return CsvImportResult(imported=imported, skipped=skipped, errors=errors)
