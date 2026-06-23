"""Unit tests for Pydantic schema validation."""

import pytest
from pydantic import ValidationError
from app.schemas import (
    ResumeTailorRequest,
    CoverLetterRequest,
    ApplicationCreate,
    ResumeCreate,
    MAX_TEXT_LENGTH,
)


def test_resume_tailor_request_valid():
    r = ResumeTailorRequest(resume_text="my resume", job_description="a job")
    assert r.resume_text == "my resume"


def test_resume_tailor_request_too_long():
    with pytest.raises(ValidationError):
        ResumeTailorRequest(resume_text="x" * (MAX_TEXT_LENGTH + 1), job_description="jd")


def test_cover_letter_request_default_tone():
    r = CoverLetterRequest(
        resume_text="resume", job_description="jd", company_name="Acme"
    )
    assert r.tone == "professional"


def test_cover_letter_request_invalid_tone():
    with pytest.raises(ValidationError):
        CoverLetterRequest(
            resume_text="resume",
            job_description="jd",
            company_name="Acme",
            tone="angry",
        )


def test_application_create_default_status():
    a = ApplicationCreate(company="Acme", role="Engineer", job_description="jd")
    assert a.status == "applied"


def test_application_create_invalid_status():
    with pytest.raises(ValidationError):
        ApplicationCreate(
            company="Acme", role="Engineer", job_description="jd", status="unknown"
        )


def test_application_create_jd_too_long():
    with pytest.raises(ValidationError):
        ApplicationCreate(
            company="Acme", role="Engineer", job_description="x" * (MAX_TEXT_LENGTH + 1)
        )


def test_resume_create_content_too_long():
    with pytest.raises(ValidationError):
        ResumeCreate(name="My Resume", content="x" * (MAX_TEXT_LENGTH + 1))
