# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
# From backend/
pip install -r requirements.txt
uvicorn app.main:app --reload           # runs on :8000
```

### Frontend
```bash
# From frontend/
npm install
npm run dev:public                      # portfolio app, runs on :5173
npm run dev:tracker                     # job tracker app, runs on :5173 (stop the other first, or pass --port)
```
The frontend builds as two separate single-page apps from one codebase — see Architecture below. `npm run build:public` and `npm run build:tracker` produce `dist-public/` and `dist-tracker/` respectively.

### Database
```bash
docker run --name job-assistant-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=jobassistant \
  -p 5432:5432 -d postgres
```
Tables are created automatically on backend startup via `create_all`.

**Any changes to the database schema require a full teardown and restart:**
```bash
docker rm -f job-assistant-db
docker run --name job-assistant-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=jobassistant \
  -p 5432:5432 -d postgres
```
Then restart the backend so `create_all` recreates the tables with the new schema.

## Architecture

### Backend (`backend/`)
FastAPI app with async SQLAlchemy (asyncpg driver). All AI calls go through `app/services/claude.py`, which loads prompt templates from `prompts/*.txt`, calls `claude-sonnet-4-6`, strips markdown code fences, and parses JSON. Routes are thin — they call one service function and return its result.

- `app/main.py` — lifespan runs `init_db()`, CORS allows `localhost:5173`
- `app/database.py` — async engine + `get_db` dependency
- `app/models.py` — single `Application` ORM model
- `app/schemas.py` — Pydantic request/response models for all 4 features
- `app/routes/` — resume, cover_letter, applications, interview
- `app/services/claude.py` — `tailor_resume`, `generate_cover_letter`, `generate_interview_prep`
- `prompts/` — system prompts as `.txt` files (loaded at call time, not import time)

Environment: `backend/.env` needs `DATABASE_URL` and `ANTHROPIC_API_KEY`.

### Frontend (`frontend/src/`)
React 18 + TypeScript + Vite + Tailwind. React Router v6 for routing. All API calls centralized in `api/client.ts` (Axios, baseURL `:8000`), which also exports all shared interfaces (`Application`, `ResumeTailorResponse`, `InterviewQuestion`, etc.). No global state — each page manages its own with `useState`/`useEffect`.

The app is split into two independent builds that deploy to two separate URLs — a public portfolio (no login, no tracker code shipped) and a private, login-gated job tracker. They share `api/client.ts`, `pages/`, and Tailwind config, but have separate entry points, root components, and navbars so neither bundle pulls in the other's code:

- `apps/public/index.html` + `src/main.public.tsx` + `src/App.public.tsx` — portfolio: Home, Projects, Experience, Contact, using `components/PublicNavbar.tsx`. No auth, no tracker routes.
- `apps/tracker/index.html` + `src/main.tracker.tsx` + `src/App.tracker.tsx` — job tracker: Login, Admin, Dashboard, and all `/tracker/*` routes gated by `components/RequireAuth.tsx`, using `components/TrackerNavbar.tsx`. Ships with `<meta name="robots" content="noindex, nofollow">`.
- `vite.config.ts` picks the root/output dir by `--mode` (`public` or `tracker`); vitest always runs against the shared `src/` root regardless of mode.

Pages:
- `pages/Dashboard` — stats cards + filterable application table
- `pages/NewApplication` — paste JD + resume, trigger tailor/cover-letter independently, save
- `pages/ApplicationDetail` — side-by-side original vs tailored resume, status/notes editing, delete
- `pages/InterviewPrep` — loads app by id, checkbox question types, renders QuestionCard list
- `components/` — PublicNavbar, TrackerNavbar, RequireAuth, ApplicationTable, StatusBadge, ResumeEditor, QuestionCard

## Deployment
- Each frontend build deploys as its own Vercel project (same repo, different build command and output dir); backend + Postgres deploy to Railway. See [DEPLOYMENT.md](DEPLOYMENT.md).
- Backend reads `CORS_ORIGINS` (comma-separated) and normalizes `DATABASE_URL` to the asyncpg scheme — see `app/main.py` and `app/database.py`. It must list both the portfolio and tracker Vercel URLs.
- Frontend reads the API base URL from `VITE_API_URL` (`src/api/client.ts`) — set it the same way on both Vercel projects.

## Git Workflow
- All development work must be done on a feature branch — never push directly to `main`
- Open a PR for every change and merge via GitHub

## Key Constraints
- Claude model is always `claude-sonnet-4-6` — do not change
- Max tokens: 2000 for resume/cover letter, 1500 for interview prep
- All Claude responses must be JSON — prompts instruct this; `claude.py` parses with error handling
- Application statuses: `applied`, `phone_screen`, `technical`, `offer`, `rejected`
