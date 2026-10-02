import logging
import os
import re
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from app.auth import require_auth
from app.database import AsyncSessionLocal, init_db
from app.routes import (
    applications,
    auth,
    cover_letter,
    events,
    interview,
    portfolio,
    profile,
    resume,
    resumes,
)
from app.seed import seed_portfolio
from app.status_path import backfill_status_paths, migrate_legacy_statuses

load_dotenv()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY is not set — add it to backend/.env")
    if not os.getenv("ADMIN_USERNAME") or not os.getenv("ADMIN_PASSWORD"):
        raise RuntimeError("ADMIN_USERNAME/ADMIN_PASSWORD are not set — add them to backend/.env")
    await init_db()
    await seed_portfolio()
    try:
        async with AsyncSessionLocal() as db:
            repaired = await backfill_status_paths(db)
            renamed = await migrate_legacy_statuses(db)
        logger.info(
            "Status backfill repaired %d application(s), renamed %d legacy status(es)",
            repaired,
            renamed,
        )
    except Exception:
        # A failed repair must not take the API down; it retries on next start.
        logger.exception("Status backfill failed; continuing startup")
    yield


app = FastAPI(title="Job Application Assistant", lifespan=lifespan)

_DEFAULT_ORIGIN = "http://localhost:5173"


def _parse_cors_origins(raw: str, default: str) -> list[str]:
    """Comma-separated origins from env, falling back to `default` if the
    result would otherwise be empty (e.g. CORS_ORIGINS set to "" or ",").
    """
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or [default]


cors_origins = _parse_cors_origins(os.getenv("CORS_ORIGINS", _DEFAULT_ORIGIN), _DEFAULT_ORIGIN)

# `*.vercel.app` is a shared namespace — anyone can register a project like
# "job-assistant-evil" and get a domain that matches a bare job-assistant*
# pattern. Preview URLs are actually `<project>-<hash>-<team-slug>.vercel.app`
# where the project may carry one extra suffix segment (the tracker project is
# `job-assistant-ow59`, so its previews are `job-assistant-ow59-<hash>-<slug>`).
# Scoping the regex to our own (globally unique) team slug means only our
# team's deployments can ever match, regardless of project name collisions.
_VERCEL_TEAM_SLUG = os.getenv("VERCEL_TEAM_SLUG", "zach-s-squad")
# Two preview URL shapes exist per deployment: the per-deploy URL above, and the
# per-branch alias `<project>-git-<branch>-<team-slug>.vercel.app`, where the
# branch name is slugified (letters, digits, hyphens) and can contain hyphens.
_vercel_preview_origin_regex = (
    r"^https://job-assistant(?:-[a-zA-Z0-9]+)?"
    rf"(?:-[a-zA-Z0-9]+|-git-[a-zA-Z0-9-]+)-{re.escape(_VERCEL_TEAM_SLUG)}\.vercel\.app$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=_vercel_preview_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(portfolio.router)
app.include_router(events.router)

_private = [Depends(require_auth)]
app.include_router(profile.router, dependencies=_private)
app.include_router(resumes.router, dependencies=_private)
app.include_router(resume.router, dependencies=_private)
app.include_router(cover_letter.router, dependencies=_private)
app.include_router(applications.router, dependencies=_private)
app.include_router(interview.router, dependencies=_private)


@app.get("/health")
async def health():
    return {"status": "ok"}
