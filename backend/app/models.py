from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, func
from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="applied")
    date_applied = Column(Date, default=func.current_date())
    job_url = Column(String, nullable=True)
    job_description = Column(Text, nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    tailored_resume = Column(Text, nullable=True)
    cover_letter = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
