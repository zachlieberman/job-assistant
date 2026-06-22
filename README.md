# Job Application Assistant

A web app to track job applications, tailor resumes, generate cover letters, and prep for interviews — powered by Claude AI.

![Dashboard](docs/dashboard.png)

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
# Edit backend/.env and add your ANTHROPIC_API_KEY
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

API runs at `http://localhost:8000`. Tables are created automatically on first startup.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

Or use the Makefile shortcuts:

```bash
make backend   # starts DB + backend
make frontend  # starts frontend
```

## Contributing

All development work should be done on a feature branch and submitted as a pull request — do not push directly to `main`.

```bash
git checkout -b feat/your-feature-name
# make changes
git push -u origin feat/your-feature-name
gh pr create
```

## Features

- **Profile** — store your LinkedIn, GitHub, and multiple resumes
- **Application Tracker** — manage applications through a status pipeline (Applied → Phone Screen → Technical → Offer / Rejected)
- **Resume Tailoring** — pick a resume, tailor it to a job description with keyword analysis
- **Cover Letter Generation** — generate cover letters in professional, conversational, or enthusiastic tone
- **Interview Prep** — generate behavioral, technical, and culture-fit questions tailored to your resume

## API

Interactive docs at `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/profile` | Get or update profile |
| GET/POST | `/resumes` | List or create resumes |
| GET/PUT/DELETE | `/resumes/{id}` | Manage a resume |
| POST | `/resume/tailor` | Tailor a resume to a job description |
| POST | `/cover-letter/generate` | Generate a cover letter |
| GET/POST | `/applications` | List or create applications |
| GET/PUT/DELETE | `/applications/{id}` | Manage an application |
| POST | `/interview/prep` | Generate interview questions |
| GET | `/health` | Health check |
