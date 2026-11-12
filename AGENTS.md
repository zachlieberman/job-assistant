# AGENTS.md

Project instructions for coding agents working in this repository. The same rules live in [CLAUDE.md](CLAUDE.md) for Claude Code. Apart from this introduction, the two files must match. When you change one, update the other in the same change. Neither file wins a conflict; reconcile both against the code.

## Commands

Postgres, the API, and the public frontend come from the Makefile, which uses `docker-compose.yml`. The database container is named `job-assistant-db`. Do not start a second Postgres with `docker run` under that name.

```bash
make up        # Postgres, waits until ready
make backend   # make up, then uvicorn on :8000
make frontend  # public app on :5173 (npm run dev)
make dev       # database, API, and public app together
make down
```

Install dependencies once:

```bash
# From backend/
pip install -r requirements.txt
pip install -r requirements-dev.txt   # pytest; or make install-dev

# From frontend/
npm install
npm run dev:tracker                   # job tracker app, runs on :5173 (stop the public app first, or pass --port)
```
The frontend builds as two separate single-page apps from one codebase — see Architecture below. `npm run build:public` and `npm run build:tracker` produce `dist/` and `dist-tracker/` respectively (the public build keeps the default `dist` name so the existing Vercel project needs no dashboard changes; plain `npm run build`/`npm run dev` are aliases for the public build, matching the previous defaults).

`build:public` also prerenders (client build, then `vite build --ssr`, then `scripts/prerender.mjs`) and **fetches portfolio content from the API at build time**, so it needs `VITE_API_URL` pointing at a reachable backend (e.g. `VITE_API_URL=http://localhost:8000 npm run build:public` with the backend running) and fails clearly if it is not. `npm run dev:public` is unaffected and renders client-side.

### Tests
```bash
make test            # backend pytest, then frontend vitest once
make test-frontend   # frontend only
```

### Database
Tables are created automatically on backend startup via `create_all`. There are no migrations.

**Any change to the database schema requires a full teardown and restart.** `make db-reset` runs `docker compose down -v` and starts a fresh database, which drops the `postgres_data` volume. Then restart the backend so `create_all` recreates the tables. Do not `docker rm` the container by hand: Compose keeps the volume, and a raw `docker run` collides with the Compose container name.

## Architecture

### Backend (`backend/`)
FastAPI app with async SQLAlchemy (asyncpg driver). All AI calls go through `app/services/claude.py`, which loads prompt templates from `prompts/*.txt`, calls `claude-sonnet-4-6`, strips markdown code fences, and parses JSON. Routes are thin — they call one service function and return its result.

- `app/main.py` — lifespan runs `init_db()`, `seed_portfolio()`, `backfill_status_paths()`, and `migrate_legacy_statuses()`. CORS defaults to `http://localhost:5173`, reads `CORS_ORIGINS`, and allows this team's Vercel preview origins.
- `app/database.py` — async engine + `get_db` dependency
- `app/models.py` — `Profile`, `Resume`, `Application`, `PortfolioBio`, `PortfolioProject`, `PortfolioExperience`, `StatusEvent`, `ClickEvent`
- `app/schemas.py` — Pydantic models for portfolio content, profile, resumes, tailoring, cover letters, applications, and interview prep
- `app/routes/` — public: `auth`, `portfolio`, `events`. Auth required: `profile`, `resumes`, `resume`, `cover_letter`, `applications`, `interview`
- `app/services/claude.py` — `tailor_resume`, `generate_cover_letter`, `generate_interview_prep`
- `prompts/` — system prompts as `.txt` files (loaded at call time, not import time)

Environment: `backend/.env` must set `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`. Startup raises if the API key or admin credentials are missing. `DATABASE_URL` is read in `app/database.py` and normalized to the asyncpg scheme. `TOKEN_SIGNING_KEY` is optional; auth falls back to `ADMIN_PASSWORD`. The auth-required routers depend on `require_auth`.

### Frontend (`frontend/src/`)
React 18 + TypeScript + Vite + Tailwind. React Router v6 for routing. All API calls centralized in `api/client.ts` (Axios, baseURL `:8000`), which also exports all shared interfaces (`Application`, `ResumeTailorResponse`, `InterviewQuestion`, etc.). No global state — each page manages its own with `useState`/`useEffect`.

The app is split into two independent builds that deploy to two separate URLs — a public portfolio (no login, no tracker code shipped) and a private, login-gated job tracker. They share `api/client.ts` and `pages/`, but have separate entry points, root components, shells, and Tailwind configs (`tailwind.public.config.js` and `tailwind.tracker.config.js`, chosen by mode in `vite.config.ts`) so neither bundle pulls in the other's code:

- `apps/public/index.html` + `src/main.public.tsx` + `src/App.public.tsx` — portfolio routes `/`, `/projects`, `/experience`, `/contact`, plus a catch-all `NotFound`. Uses `components/PublicNavbar.tsx` (the menu is `components/public/SiteMenu.tsx`). No auth, no tracker routes.
- `apps/tracker/index.html` + `src/main.tracker.tsx` + `src/App.tracker.tsx` — job tracker. `Login` is public. `Admin` (`/admin`) and every `/tracker/*` route are gated by `components/RequireAuth.tsx`. The shell is `components/TrackerShell.tsx` with `components/Sidebar.tsx`. There is no `TrackerNavbar`. Ships with `<meta name="robots" content="noindex, nofollow">`.
- `vite.config.ts` picks the root/output dir by `--mode` (`public` or `tracker`); vitest always runs against the shared `src/` root regardless of mode.
- Public prerendering: `src/entry-server.tsx` exports `render(url)` (React Router `StaticRouter` + react-helmet-async) and `scripts/prerender.mjs` writes `index.html`, `projects/`, `experience/`, `contact/` and `404.html` into `dist/`. Build-time data is seeded into the `useApiResource` cache (`src/lib/prerenderData.ts`; keys `bio`, `projects`, `experience` must match the pages) and embedded as JSON so `main.public.tsx` hydrates with identical data. Anything that renders differently on server and client (browser-only checks in initial state) breaks hydration; `src/test/hydration.test.tsx` guards this. Server-render tests use `// @vitest-environment node`.
- The resume is a static file, `frontend/apps/public/public/Zachary-Lieberman-Resume.pdf` (linked from the hero, closing block, Contact page and footer via `src/content/resume.ts`). It is a web copy with the phone number removed; replace the file to update it and keep personal contact details out of it.
- Skills, education and certifications on the Experience page live in `frontend/src/content/profile.ts` (not the admin panel; a schema change would need a DB reset). The same file feeds the home page's `alumniOf` and `knowsAbout` structured data.
- `sitemap.xml` is generated by `scripts/prerender.mjs` (content-hash based `lastmod`, see `scripts/sitemap.mjs`); do not add a static one to `apps/public/public/`. `vercel.json` sets a Content-Security-Policy for both apps, so a new external origin (script, API, font, image) must be added to it.
- `vercel.json` has no catch-all rewrite (unknown public URLs return the prerendered `404.html` with a 404). The tracker build copies its shell to `404.html` in `vite.config.ts` so its deep links still load.

Pages:

Public:
- `pages/Home`, `pages/Projects`, `pages/Experience`, `pages/Contact`, `pages/NotFound`

Tracker:
- `pages/Login` — unauthenticated
- `pages/Admin` — `/admin`, edit portfolio bio, projects, and experience
- `pages/Dashboard` — `/tracker`, stats cards and filterable application table
- `pages/NewApplication` — `/tracker/new`, paste a job description and resume, trigger tailor and cover letter independently, save
- `pages/ApplicationDetail` — `/tracker/applications/:id`, original vs tailored resume, status and notes, delete
- `pages/InterviewPrep` — `/tracker/interview/:id`, question-type checkboxes, `QuestionCard` list
- `pages/Journey` — `/tracker/journey`, application status path
- `pages/Profile` — `/tracker/profile`, saved resumes and profile links

Components agents usually touch: `PublicNavbar`, `SiteMenu`, `TrackerShell`, `Sidebar`, `RequireAuth`, `ApplicationTable`, `StatusBadge`, `ResumeEditor`, `QuestionCard`.

## Deployment
- Each frontend build deploys as its own Vercel project (same repo, different build command and output dir); backend + Postgres deploy to Railway. See [DEPLOYMENT.md](DEPLOYMENT.md).
- Because the public build bakes content into static HTML, admin content edits reach crawlers only after a redeploy of the public Vercel project (visitors see edits immediately via the runtime refresh).
- Backend reads `CORS_ORIGINS` (comma-separated) and normalizes `DATABASE_URL` to the asyncpg scheme — see `app/main.py` and `app/database.py`. It must list both the portfolio and tracker Vercel URLs.
- Frontend reads the API base URL from `VITE_API_URL` (`src/api/client.ts`) — set it the same way on both Vercel projects.

## Git Workflow
- All development work must be done on a feature branch — never push directly to `main`
- Open a PR for every change and merge via GitHub
- Branch, commit, and pull request names come from one canonical name, chosen before the branch is created.

  Canonical name: `<type>: <imperative summary>`

  - Pull request title: the canonical name, exactly.
  - Squash-merge commit: the same canonical name. GitHub adds the PR number.
  - Branch: `<type>/<slug>`. The slug is two to five kebab-case words taken from the summary. Every slug word must appear in the summary. Drop filler words such as "add" and "and". No tool name, hash, or ticket suffix.
  - The first commit uses the canonical name as its subject. Later commits keep the same `<type>:` and describe only their slice. Those slice subjects do not have to match the pull request title.
  - If the pull request grows into a different change, retitle it to a new canonical name of the same type. Rename the branch only when the type changes or the old slug no longer describes the work.

  Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.

  Example: branch `feat/resume-closing-contact`, commit and pull request `feat: add resume link and closing contact block`.

## Key Constraints
- Claude model is always `claude-sonnet-4-6` — do not change
- Max tokens: 2000 for resume/cover letter, 1500 for interview prep
- All Claude responses must be JSON — prompts instruct this; `claude.py` parses with error handling
- Application statuses: `applied`, `recruiter_screen`, `interview`, `final_interview`, `offer`, `rejected` (old `phone_screen`/`technical` rows are renamed on startup by `migrate_legacy_statuses`)
