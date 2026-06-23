"""Integration tests for AI-powered routes (resume, cover letter, interview).

Claude API calls are patched so tests are fast and free.
"""

import pytest
from unittest.mock import AsyncMock, patch

pytestmark = pytest.mark.asyncio

_TAILOR_RESPONSE = {
    "tailored_resume": "Tailored resume text",
    "changes": [{"original": "old", "updated": "new", "reason": "better"}],
    "keyword_matches": ["Python", "FastAPI"],
    "missing_keywords": ["Kubernetes"],
}

_COVER_LETTER_RESPONSE = {"cover_letter": "Dear Hiring Manager, ..."}

_INTERVIEW_RESPONSE = {
    "questions": [
        {"question": "Tell me about yourself", "type": "behavioral", "tip": "Use STAR"}
    ]
}


# ---------------------------------------------------------------------------
# Resume tailoring
# ---------------------------------------------------------------------------


async def test_tailor_resume_success(client):
    with patch(
        "app.services.claude.tailor_resume", new_callable=AsyncMock
    ) as mock_tailor:
        mock_tailor.return_value = _TAILOR_RESPONSE
        resp = await client.post(
            "/resume/tailor",
            json={"resume_text": "my resume", "job_description": "a great job"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["tailored_resume"] == "Tailored resume text"
    assert "Python" in body["keyword_matches"]


async def test_tailor_resume_claude_error(client):
    with patch(
        "app.services.claude.tailor_resume", new_callable=AsyncMock
    ) as mock_tailor:
        mock_tailor.side_effect = ValueError("Claude returned invalid JSON")
        resp = await client.post(
            "/resume/tailor",
            json={"resume_text": "my resume", "job_description": "a job"},
        )
    assert resp.status_code == 500
    assert "Claude returned invalid JSON" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# Cover letter
# ---------------------------------------------------------------------------


async def test_generate_cover_letter_success(client):
    with patch(
        "app.services.claude.generate_cover_letter", new_callable=AsyncMock
    ) as mock_cl:
        mock_cl.return_value = _COVER_LETTER_RESPONSE
        resp = await client.post(
            "/cover-letter/generate",
            json={
                "resume_text": "resume",
                "job_description": "jd",
                "company_name": "Acme",
                "tone": "professional",
            },
        )
    assert resp.status_code == 200
    assert resp.json()["cover_letter"].startswith("Dear")


async def test_generate_cover_letter_claude_error(client):
    with patch(
        "app.services.claude.generate_cover_letter", new_callable=AsyncMock
    ) as mock_cl:
        mock_cl.side_effect = RuntimeError("API error")
        resp = await client.post(
            "/cover-letter/generate",
            json={
                "resume_text": "resume",
                "job_description": "jd",
                "company_name": "Acme",
            },
        )
    assert resp.status_code == 500


# ---------------------------------------------------------------------------
# Interview prep
# ---------------------------------------------------------------------------


async def test_interview_prep_success(client):
    with patch(
        "app.services.claude.generate_interview_prep", new_callable=AsyncMock
    ) as mock_ip:
        mock_ip.return_value = _INTERVIEW_RESPONSE
        resp = await client.post(
            "/interview/prep",
            json={
                "job_description": "jd",
                "resume_text": "resume",
                "question_types": ["behavioral"],
            },
        )
    assert resp.status_code == 200
    questions = resp.json()["questions"]
    assert len(questions) == 1
    assert questions[0]["type"] == "behavioral"


async def test_interview_prep_claude_error(client):
    with patch(
        "app.services.claude.generate_interview_prep", new_callable=AsyncMock
    ) as mock_ip:
        mock_ip.side_effect = ValueError("bad json")
        resp = await client.post(
            "/interview/prep",
            json={
                "job_description": "jd",
                "resume_text": "resume",
                "question_types": ["behavioral"],
            },
        )
    assert resp.status_code == 500
