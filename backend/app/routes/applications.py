import csv
import io
from datetime import date, datetime

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models import Application
from app.schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse, ApplicationStatus

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


@router.post("", response_model=ApplicationResponse, status_code=201)
async def create_application(
    payload: ApplicationCreate, db: AsyncSession = Depends(get_db)
):
    app = Application(**payload.model_dump())
    db.add(app)
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
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(app, field, value)
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
        imported += 1

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return CsvImportResult(imported=imported, skipped=skipped, errors=errors)
