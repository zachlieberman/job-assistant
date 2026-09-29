# Deploying to Vercel + Railway

The frontend builds as two separate single-page apps from one repo — a public
portfolio and a private, login-gated job tracker — and deploys as two
separate Vercel projects. The backend + Postgres deploy to Railway as one
service, shared by both frontends.

Everything in this repo (Dockerfile, `railway.json`, `vercel.json`,
`vite.config.ts`, env-driven CORS and DB config) is already set up for this —
the steps below are the manual, one-time account setup that has to happen in
each provider's dashboard.

## 1. Railway — backend + Postgres

1. Create a Railway account at https://railway.app (GitHub login is easiest).
2. **New Project → Deploy from GitHub repo** → select this repo.
3. Railway will try to build the repo root. Since this is a monorepo:
   - Open the created service's **Settings → Root Directory** and set it to `backend`.
   - It will detect `backend/Dockerfile` and `backend/railway.json` automatically on the next deploy.
4. **Add a database**: in the same project, click **New → Database → PostgreSQL**.
   Railway provisions it and exposes a reference variable.
5. On the **backend service**, go to **Variables** and add:
   - `DATABASE_URL` → set it to `${{Postgres.DATABASE_URL}}` (Railway's variable reference to the Postgres service — pick it from the variable reference dropdown rather than typing it, so it stays in sync)
   - `ANTHROPIC_API_KEY` → your key from https://console.anthropic.com/
   - `CORS_ORIGINS` → leave a placeholder for now (e.g. `http://localhost:5173`) — you'll update this in step 4 once you have both Vercel URLs
6. Deploy. Once it's up, Railway gives the service a public URL under **Settings → Networking → Generate Domain** (something like `job-assistant-backend-production.up.railway.app`). Confirm it works by visiting `<that-url>/health` — should return `{"status":"ok"}`.

## 2. Vercel — public portfolio

1. Create a Vercel account at https://vercel.com (GitHub login is easiest).
2. **Add New → Project** → import this repo.
3. In the import screen, set **Root Directory** to `frontend`.
4. Override the auto-detected build settings:
   - **Build Command** → `npm run build:public`
   - **Output Directory** → `dist-public`
5. Under **Environment Variables**, add:
   - `VITE_API_URL` → the Railway backend URL from step 1.6
6. Deploy. Vercel gives you a URL like `zachlieberman.vercel.app`. This is the
   public, indexable site — no login, no tracker code is in this bundle.
7. (Optional) Attach a custom domain under **Settings → Domains**.

## 3. Vercel — private job tracker

1. **Add New → Project** → import the *same* repo again (Vercel allows a repo to back multiple projects).
2. Set **Root Directory** to `frontend` again.
3. Override the build settings:
   - **Build Command** → `npm run build:tracker`
   - **Output Directory** → `dist-tracker`
4. Under **Environment Variables**, add the same:
   - `VITE_API_URL` → the Railway backend URL from step 1.6
5. Deploy. Vercel gives you a second, separate URL (something like
   `job-assistant-tracker.vercel.app`). This build ships
   `<meta name="robots" content="noindex, nofollow">` and is never linked from
   the public site — keep this URL private (don't post it publicly, don't
   link to it from anywhere search engines or the portfolio can crawl).
6. (Optional) Attach a private/unlisted custom domain if you want something
   less guessable than the default `*.vercel.app` URL.

## 4. Close the loop: update CORS on Railway

Now that you have both Vercel URLs:

1. Back in Railway, on the backend service's **Variables**, set:
   - `CORS_ORIGINS` → both production domains, comma-separated, e.g.:
     `CORS_ORIGINS=https://zachlieberman.vercel.app,https://job-assistant-tracker.vercel.app`
   - If you also want Vercel's preview deployments (per-branch URLs, for *both* projects) to work against the live API, add those too, comma-separated.
2. Redeploy the backend service for the new value to take effect.

## 5. Verify end to end

- Open the public URL: Home/Projects/Experience/Contact load, no login link or tracker route is reachable, and the browser's dev tools show no requests to tracker-only endpoints.
- Open the tracker URL: it requires login, the dashboard loads after signing in, and API calls succeed (check the Network tab for `200`s against the Railway URL, no CORS errors in the console).
- Try creating an application on the tracker to confirm writes reach the Railway Postgres instance.
- Confirm the tracker URL doesn't appear anywhere on the public site (view source / check all links).

## Notes / things you'll want to know

- **Cost**: Vercel Hobby allows multiple projects per account for free for personal use. Railway's Hobby plan is $5/month and includes usage credit that should cover a small always-on backend + small Postgres instance at personal-use traffic.
- **Anthropic API usage is billed separately** (per-token), regardless of hosting — not part of the above.
- **Secrets**: `ANTHROPIC_API_KEY` and `DATABASE_URL` only ever live in Railway's dashboard env vars — never commit them, and they're not exposed to either frontend.
- **Tracker privacy**: the tracker build is `noindex`, but that only discourages search engines — it is not access control. Anyone with the tracker URL still needs valid tracker login credentials to see any data (backend routes are auth-gated), but treat the URL itself as something to keep private, since a guessable or shared link is still reachable.
- **Preview deployments**: every branch/PR gets its own Vercel URL automatically, for each of the two projects. If you want those to work against the live API too, add each preview URL (or a wildcard pattern you check for in code) to `CORS_ORIGINS`.
