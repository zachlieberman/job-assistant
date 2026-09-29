import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from app.auth import require_auth
from app.database import init_db
from app.routes import (
    applications,
    auth,
    cover_letter,
    interview,
    portfolio,
    profile,
    resume,
    resumes,
)
from app.seed import seed_portfolio

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY is not set — add it to backend/.env")
    if not os.getenv("ADMIN_USERNAME") or not os.getenv("ADMIN_PASSWORD"):
        raise RuntimeError("ADMIN_USERNAME/ADMIN_PASSWORD are not set — add them to backend/.env")
    await init_db()
    await seed_portfolio()
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(portfolio.router)

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
