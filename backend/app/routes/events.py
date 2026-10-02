import hmac
import os
import time
from collections import deque
from datetime import date, datetime, time as dtime, timedelta
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import ClickEvent

router = APIRouter(prefix="/events", tags=["events"])

ClickTarget = Literal["resume", "email", "linkedin", "github"]
CONTACT_TARGETS = ("email", "linkedin", "github")

# The write endpoint is public, so cap total writes. The cap is global rather than
# per-IP: behind the host's proxy every request can share one client address.
MAX_CLICKS_PER_MINUTE = 120
_recent_clicks: deque[float] = deque()


class ClickPayload(BaseModel):
    target: ClickTarget
    page: str = Field(max_length=200)


class ClickSummary(BaseModel):
    date: date
    resume: int
    email: int
    linkedin: int
    github: int
    contact: int


def _check_click_rate_limit() -> None:
    now = time.time()
    while _recent_clicks and now - _recent_clicks[0] >= 60:
        _recent_clicks.popleft()
    if len(_recent_clicks) >= MAX_CLICKS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Too many events")
    _recent_clicks.append(now)


def require_stats_key(x_stats_key: str = Header(default="")) -> None:
    expected = os.environ.get("STATS_API_KEY", "")
    # An unset key must never authenticate, even against an empty header.
    if not expected or not hmac.compare_digest(x_stats_key, expected):
        raise HTTPException(status_code=401, detail="Invalid stats key")


@router.post("/click", status_code=204)
async def record_click(payload: ClickPayload, db: AsyncSession = Depends(get_db)):
    _check_click_rate_limit()
    db.add(ClickEvent(target=payload.target, page=payload.page))
    await db.commit()
    return Response(status_code=204)


@router.get("/summary", response_model=ClickSummary, dependencies=[Depends(require_stats_key)])
async def click_summary(date: date, db: AsyncSession = Depends(get_db)):
    """Click counts for one UTC day, used by the daily traffic spreadsheet."""
    start = datetime.combine(date, dtime.min)
    end = start + timedelta(days=1)
    rows = await db.execute(
        select(ClickEvent.target, func.count())
        .where(ClickEvent.created_at >= start, ClickEvent.created_at < end)
        .group_by(ClickEvent.target)
    )
    counts = {target: 0 for target in ("resume", *CONTACT_TARGETS)}
    counts.update({target: n for target, n in rows.all()})
    return ClickSummary(date=date, contact=sum(counts[t] for t in CONTACT_TARGETS), **counts)
