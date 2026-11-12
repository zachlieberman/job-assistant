# Job Application Assistant

A web app to track job applications, tailor resumes, generate cover letters, and prep for interviews — powered by Claude AI.

The codebase ships as two separate apps that share one backend:

### Public portfolio

A login-free portfolio site (Home, Projects, Experience, Contact) whose content is editable from the tracker's Admin page.

![Portfolio home page](docs/portfolio-home.png)

| Projects | Experience |
|----------|------------|
| ![Portfolio projects page](docs/portfolio-projects.png) | ![Portfolio experience page](docs/portfolio-experience.png) |

### Private job tracker

A login-gated dashboard for managing your job search. Run it with `npm run dev:tracker` (see [Setup](#4-frontend)).

![Job tracker dashboard](docs/tracker-dashboard.png)

| Login | Journey (Sankey) |
|-------|------------------|
| ![Tracker login](docs/tracker-login.png) | ![Application journey Sankey diagram](docs/tracker-journey.png) |

> Screenshots use dummy data (a fictional "Alex Rivera" profile and sample applications).

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker
- An [Anthropic API key](https://console.anthropic.com/)

## Setup

### 1. Clone and configure secrets

```bash
git clone <repo-url>
cd job-assistant

cp backend/.env.example backend/.env
# Set ANTHROPIC_API_KEY and change ADMIN_PASSWORD.
# Startup fails without the API key, ADMIN_USERNAME, and ADMIN_PASSWORD.
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Tables are created automatically on first startup. There are no migrations. After a schema change, run `make db-reset` (this deletes the `postgres_data` volume) and restart the backend. Do not replace the Compose database with a raw `docker run`: the container name is `job-assistant-db` in both cases.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev:public    # portfolio site
npm run dev:tracker   # job tracker (pass --port if the portfolio is running)
```

Apps run at `http://localhost:5173`.

---

Or use the Makefile shortcuts:

```bash
make backend   # starts DB + backend
make frontend  # public portfolio on :5173
make dev       # database, API, and public app
make test      # backend pytest, then frontend vitest once
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploying the frontend to Vercel and the backend + Postgres to Railway.

## Testing

```bash
make test            # run all tests (backend + frontend)
make test-frontend   # frontend only
```

### Backend

The backend has a pytest suite that runs against an in-memory SQLite database — no live Postgres or Anthropic API key needed.

#### Setup

```bash
make install-dev   # installs pytest, httpx, aiosqlite alongside app deps
```

#### Running backend tests

```bash
cd backend
python -m pytest                                     # all tests
python -m pytest tests/test_applications.py          # one file
python -m pytest -k "csv"                            # filter by keyword
python -m pytest -v                                  # verbose output
```

#### Guidelines for new backend tests

- **Place tests in `backend/tests/`** in a file named `test_<feature>.py`.
- **Use the `client` fixture** for route tests — it wires the app to an isolated in-memory DB and tears it down after each test.
- **Mock Claude calls** with `unittest.mock.patch` + `AsyncMock` — never make real API calls in tests.
- **Keep tests independent** — each test gets a fresh database; do not share state across tests.
- **Name tests descriptively**: `test_<action>_<condition>` (e.g. `test_create_application_missing_company`).

### Frontend

The frontend has a test suite built with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/).

```bash
cd frontend
npm test               # watch mode
npm run test:coverage  # with coverage report
```

Tests live in `frontend/src/test/` and cover both the portfolio and the tracker, including pages, navigation, SEO, and hydration.

## Contributing

All development work should be done on a feature branch and submitted as a pull request — do not push directly to `main`.

Name the branch, the pull request, and the squash-merge commit from one string: `<type>: <imperative summary>`. The branch is `<type>/<slug>`, two to five kebab-case words that appear in that summary. Types are `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, and `ci`. Later commits on the branch keep that type and describe only their slice. `AGENTS.md` and `CLAUDE.md` carry the same rule.

```bash
git checkout -b feat/resume-closing-contact
# make changes
make test          # confirm tests pass before opening a PR
git push -u origin feat/resume-closing-contact
gh pr create --title "feat: add resume link and closing contact block"
```

## Features

- **Profile** — store your LinkedIn, GitHub, and multiple resumes
- **Application Tracker** — manage applications through a status pipeline (Applied → Recruiter Screen → Interview → Final Interview → Offer / Rejected)
  - Search by company or role
  - Sort by any column (Company, Role, Status, Applied date), defaulting to most recent first
  - Import applications from a CSV file (tab or comma delimited, Excel-compatible)
  - Export the current filtered/sorted view to a CSV file
  - Dashboard with weekly activity, pipeline breakdown, and recent applications (see the [dashboard screenshot](#private-job-tracker))
  - Journey view: a Sankey diagram of how applications flow between stages
  - Per-application detail page with status, job description, tailored resume, cover letter, and notes

  ![Application detail page](docs/tracker-application.png)
- **Resume Tailoring** — pick a resume, tailor it to a job description with keyword analysis
- **Cover Letter Generation** — generate cover letters in professional, conversational, or enthusiastic tone
- **Interview Prep** — generate behavioral, technical, and culture-fit questions tailored to your resume

## API

Interactive docs at `http://localhost:8000/docs`

Tracker, profile, resume, and interview routes require a login. Portfolio reads, `POST /auth/login`, `POST /events/click`, and `GET /health` do not. Portfolio writes require a login. `GET /events/summary` requires an `X-Stats-Key` header set to `STATS_API_KEY` and a `date` query parameter.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Log in to the tracker and admin panel |
| GET/PUT | `/portfolio/bio` | Read or update the public bio |
| GET/POST | `/portfolio/projects` | List or create portfolio projects |
| GET/PUT/DELETE | `/portfolio/projects/{id}` | Manage a portfolio project |
| GET/POST | `/portfolio/experience` | List or create experience entries |
| GET/PUT/DELETE | `/portfolio/experience/{id}` | Manage an experience entry |
| POST | `/events/click` | Record a public resume or contact click |
| GET | `/events/summary` | Click totals for one UTC day. Header `X-Stats-Key`, query `date` |
| GET/PUT | `/profile` | Get or update profile |
| GET/POST | `/resumes` | List or create resumes |
| GET/PUT/DELETE | `/resumes/{id}` | Manage a resume |
| POST | `/resume/tailor` | Tailor a resume to a job description |
| POST | `/cover-letter/generate` | Generate a cover letter |
| GET/POST | `/applications` | List or create applications |
| GET | `/applications/sankey-data` | Data for the journey diagram |
| GET/PUT/DELETE | `/applications/{id}` | Manage an application |
| POST | `/applications/import-csv` | Bulk import applications from a CSV file |
| POST | `/interview/prep` | Generate interview questions |
| GET | `/health` | Health check |
