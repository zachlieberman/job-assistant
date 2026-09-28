import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from app.database import init_db
from app.routes import resume, cover_letter, applications, interview, profile, resumes

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY is not set — add it to backend/.env")
    await init_db()
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

app.include_router(profile.router)
app.include_router(resumes.router)
app.include_router(resume.router)
app.include_router(cover_letter.router)
app.include_router(applications.router)
app.include_router(interview.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
