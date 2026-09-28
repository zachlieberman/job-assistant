# Deploying to Vercel + Railway

This deploys the frontend to Vercel and the backend + Postgres to Railway.
Everything in this repo (Dockerfile, `railway.json`, `vercel.json`, env-driven
CORS and DB config) is already set up for this — the steps below are the
manual, one-time account setup that has to happen in each provider's dashboard.

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
   - `CORS_ORIGINS` → leave a placeholder for now (e.g. `http://localhost:5173`) — you'll update this in step 3 once you have the Vercel URL
6. Deploy. Once it's up, Railway gives the service a public URL under **Settings → Networking → Generate Domain** (something like `job-assistant-backend-production.up.railway.app`). Confirm it works by visiting `<that-url>/health` — should return `{"status":"ok"}`.

## 2. Vercel — frontend

1. Create a Vercel account at https://vercel.com (GitHub login is easiest).
2. **Add New → Project** → import this repo.
3. In the import screen, set **Root Directory** to `frontend`. Vercel auto-detects Vite (build command `npm run build`, output dir `dist`) — no changes needed there.
4. Under **Environment Variables**, add:
   - `VITE_API_URL` → the Railway backend URL from step 1.6 (e.g. `https://job-assistant-backend-production.up.railway.app`)
5. Deploy. Vercel gives you a URL like `job-assistant.vercel.app` (plus a unique preview URL per branch/PR).

## 3. Close the loop: update CORS on Railway

Now that you have the Vercel URL(s):

1. Back in Railway, on the backend service's **Variables**, set:
   - `CORS_ORIGINS` → `https://job-assistant.vercel.app` (your production domain). If you also want Vercel's preview deployments (per-branch URLs) to be able to call the API, add them comma-separated, e.g.:
     `CORS_ORIGINS=https://job-assistant.vercel.app,https://job-assistant-git-main-yourname.vercel.app`
2. Redeploy the backend service for the new value to take effect.

## 4. Verify end to end

- Open the Vercel URL, confirm the dashboard loads and API calls succeed (check the Network tab for `200`s against the Railway URL, no CORS errors in the console).
- Try creating an application to confirm writes reach the Railway Postgres instance.

## Notes / things you'll want to know

- **Cost**: Vercel Hobby is free for personal use. Railway's Hobby plan is $5/month and includes usage credit that should cover a small always-on backend + small Postgres instance at personal-use traffic.
- **Anthropic API usage is billed separately** (per-token), regardless of hosting — not part of the above.
- **Secrets**: `ANTHROPIC_API_KEY` and `DATABASE_URL` only ever live in Railway's dashboard env vars — never commit them, and they're not exposed to the frontend.
- **No auth yet**: this app has no login/user accounts — anyone with the Vercel URL who can also reach the Railway backend (once CORS is opened to it) shares one dataset. Fine for personal use; add auth before sharing the link publicly.
- **Preview deployments**: every branch/PR gets its own Vercel URL automatically. If you want those to work against the live API too, add each preview URL (or a wildcard pattern you check for in code) to `CORS_ORIGINS`.
