from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import PortfolioBio, PortfolioExperience, PortfolioProject

DEFAULT_BIO = {
    "name": "Zachary Lieberman",
    "title": "Software Engineer",
    "location": "Los Angeles, CA",
    "bio": (
        "Software engineer with 3 years of experience building backend services, data layers, "
        "APIs, and interactive product features. At Capital One, I've built Python batch jobs, "
        "an ORM-backed PostgreSQL data layer, policy dry-run tooling, and TypeScript/GraphQL "
        "dashboard features running at enterprise AWS scale — including a platform handling "
        "200M+ daily policy evaluations. I also build independent projects in Go and Python."
    ),
    "email": "zacharylieberman1@gmail.com",
    "github_url": "https://github.com/zachlieberman",
    "linkedin_url": "https://linkedin.com/in/zachary-lieberman6",
}

DEFAULT_PROJECTS = [
    {
        "name": "Job Application Assistant — Full-Stack AI App",
        "description": (
            "A full-stack job-search app with an async FastAPI backend and React/TypeScript "
            "frontend — tailors resumes and generates cover letters and interview prep with the "
            "Anthropic API, plus a D3 Sankey view of application status flow."
        ),
        "tags": ["Python", "FastAPI", "React", "TypeScript", "PostgreSQL", "Claude AI"],
        "link": None,
    },
    {
        "name": "Serverless Todo API — Go, AWS",
        "description": (
            "A Go REST API for todo management running on AWS Lambda and API Gateway, with IAM "
            "SigV4-authorized endpoints, DynamoDB persistence, and infrastructure defined in "
            "SAM/CloudFormation."
        ),
        "tags": ["Go", "AWS Lambda", "API Gateway", "DynamoDB", "SAM"],
        "link": None,
    },
    {
        "name": "awsgo — S3 Management CLI",
        "description": (
            "A Go CLI built with Cobra and the AWS SDK for Go v2 to create, list, and delete S3 "
            "buckets and stream objects to and from local files."
        ),
        "tags": ["Go", "AWS S3", "Cobra"],
        "link": None,
    },
    {
        "name": "Team Slack Bot — Innovation Sprint",
        "description": (
            "An object-oriented Python Slack bot built in a two-week innovation sprint, running "
            "on Fargate and integrating PagerDuty and ServiceNow APIs to surface recurring team "
            "information."
        ),
        "tags": ["Python", "Slack Bolt", "AWS Fargate", "CloudFormation"],
        "link": None,
    },
    {
        "name": "AI Workflow Platform — n8n on AWS",
        "description": (
            "A self-hosted n8n workflow platform deployed on AWS EC2 with Docker Compose, custom "
            "HTTP nodes for external APIs, and AI agents for task automation and data enrichment."
        ),
        "tags": ["n8n", "Docker", "AWS EC2"],
        "link": None,
    },
    {
        "name": "TV Episode Tracker",
        "description": (
            "A Python service that polls the TVmaze API for recently aired episodes and sends "
            "digest alerts via ntfy.sh or Gmail SMTP, with JSON-based caching to avoid duplicate "
            "notifications."
        ),
        "tags": ["Python", "TVmaze API", "Cron"],
        "link": None,
    },
]

DEFAULT_EXPERIENCE = [
    {
        "role": "Software Engineer",
        "company": "Capital One — Slingshot Product Team",
        "period": "Dec 2025 – May 2026",
        "bullets": [
            "Built end-to-end Warehouse Performance, Contract Analysis, and Data Explorer "
            "dashboard features to help customers explore live supply-chain data.",
            "Built GraphQL support in a TypeScript backend and reusable React dashboard "
            "components, contributing to the team's replacement of 10 legacy QuickSight "
            "dashboards.",
            "Implemented interactive bar-chart drill-down and filter-state synchronization, "
            "including a dynamic \"top 10 + Other\" breakdown that recalculates without stale "
            "results or unnecessary re-renders.",
            "Wrote ClickHouse SQL for high-volume analytics, connecting Snowflake and Databricks "
            "data into GraphQL-powered dashboards.",
        ],
    },
    {
        "role": "Software Engineer (promoted to Senior Associate, Jan 2025)",
        "company": "Capital One — Cloud Custodian Platform Team",
        "period": "Aug 2023 – Dec 2025",
        "bullets": [
            "Integrated a Python/boto3 pre-evaluation Lambda with SQS and DynamoDB to skip "
            "unnecessary policy batch jobs, enabling a 360-to-300 reduction in EC2 instances and "
            "an estimated $1M+ in annual savings.",
            "Designed an Aurora PostgreSQL database and SQLAlchemy ORM data layer with Alembic "
            "migrations, IAM policies, and automation.",
            "Built PostgreSQL/ECS policy dry-runs across 10,000+ compliance policies and 3,000+ "
            "accounts, contributing to a ~60% year-over-year drop in flawed-policy incidents.",
            "Led an in-place migration of 100+ live Lambda/ECS/RDS services to a smaller-account "
            "model with zero service disruption using blue/green deployments.",
            "Reworked a sequential Python event-forwarding driver with ThreadPoolExecutor and "
            "account batching, cutting deployment time from 2–3 hours to 2–3 minutes across "
            "1,600+ accounts.",
        ],
    },
]


async def seed_portfolio() -> None:
    async with AsyncSessionLocal() as db:
        if not (await db.execute(select(PortfolioBio).limit(1))).scalar_one_or_none():
            db.add(PortfolioBio(**DEFAULT_BIO))

        if not (await db.execute(select(PortfolioProject).limit(1))).scalar_one_or_none():
            for i, project in enumerate(DEFAULT_PROJECTS):
                db.add(PortfolioProject(sort_order=i, **project))

        if not (await db.execute(select(PortfolioExperience).limit(1))).scalar_one_or_none():
            for i, entry in enumerate(DEFAULT_EXPERIENCE):
                db.add(PortfolioExperience(sort_order=i, **entry))

        await db.commit()
