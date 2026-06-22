from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal
from datetime import date, datetime

ApplicationStatus = Literal["applied", "phone_screen", "technical", "offer", "rejected"]
CoverLetterTone = Literal["professional", "conversational", "enthusiastic"]
MAX_TEXT_LENGTH = 50_000


# Profile
class ProfileUpdate(BaseModel):
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    linkedin_url: Optional[str]
    github_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Resume (stored in profile)
class ResumeCreate(BaseModel):
    name: str
    content: str

    @field_validator("content")
    @classmethod
    def check_max_length(cls, v: str) -> str:
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Input too long (max {MAX_TEXT_LENGTH} characters)")
        return v


class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None


class ResumeResponse(BaseModel):
    id: int
    name: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Resume tailoring
class ResumeTailorRequest(BaseModel):
    resume_text: str
    job_description: str

    @field_validator("resume_text", "job_description")
    @classmethod
    def check_max_length(cls, v: str) -> str:
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Input too long (max {MAX_TEXT_LENGTH} characters)")
        return v


class ResumeChange(BaseModel):
    original: str
    updated: str
    reason: str


class ResumeTailorResponse(BaseModel):
    tailored_resume: str
    changes: List[ResumeChange]
    keyword_matches: List[str]
    missing_keywords: List[str]


# Cover Letter
class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str
    company_name: str
    tone: CoverLetterTone = "professional"

    @field_validator("resume_text", "job_description")
    @classmethod
    def check_max_length(cls, v: str) -> str:
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Input too long (max {MAX_TEXT_LENGTH} characters)")
        return v


class CoverLetterResponse(BaseModel):
    cover_letter: str


# Applications
class ApplicationCreate(BaseModel):
    company: str
    role: str
    job_url: Optional[str] = None
    job_description: str
    status: ApplicationStatus = "applied"
    notes: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None

    @field_validator("job_description")
    @classmethod
    def check_max_length(cls, v: str) -> str:
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"Input too long (max {MAX_TEXT_LENGTH} characters)")
        return v


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    tailored_resume: Optional[str] = None
    cover_letter: Optional[str] = None
    job_url: Optional[str] = None
    resume_id: Optional[int] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    company: str
    role: str
    status: str
    date_applied: date
    job_url: Optional[str]
    job_description: str
    resume_id: Optional[int]
    tailored_resume: Optional[str]
    cover_letter: Optional[str]
    notes: Optional[str]
    location: Optional[str]
    salary_range: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Interview
class InterviewPrepRequest(BaseModel):
    job_description: str
    resume_text: str
    question_types: List[str]


class InterviewQuestion(BaseModel):
    question: str
    type: str
    tip: str


class InterviewPrepResponse(BaseModel):
    questions: List[InterviewQuestion]
