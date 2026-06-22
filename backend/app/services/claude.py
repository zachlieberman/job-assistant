import json
import os
from pathlib import Path
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

# AsyncAnthropic reads ANTHROPIC_API_KEY from the environment automatically
client = AsyncAnthropic()

PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

# Load all prompts once at startup — fail fast if a file is missing
PROMPTS: dict[str, str] = {
    name: (PROMPTS_DIR / name).read_text()
    for name in ["resume_tailor.txt", "cover_letter.txt", "interview_prep.txt"]
}


async def _call_claude(system: str, user: str, max_tokens: int) -> dict:
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    text = response.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0]
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude returned invalid JSON: {e}") from e


async def tailor_resume(resume_text: str, job_description: str) -> dict:
    user = f"JOB DESCRIPTION:\n{job_description}\n\nRESUME:\n{resume_text}"
    return await _call_claude(PROMPTS["resume_tailor.txt"], user, max_tokens=4000)


async def generate_cover_letter(
    resume_text: str,
    job_description: str,
    company_name: str,
    tone: str,
) -> dict:
    system = PROMPTS["cover_letter.txt"].replace("{tone}", tone)
    user = (
        f"COMPANY: {company_name}\n\n"
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"RESUME:\n{resume_text}"
    )
    return await _call_claude(system, user, max_tokens=2000)


async def generate_interview_prep(
    job_description: str,
    resume_text: str,
    question_types: list[str],
) -> dict:
    types_str = ", ".join(question_types)
    user = (
        f"REQUESTED QUESTION TYPES: {types_str}\n\n"
        f"JOB DESCRIPTION:\n{job_description}\n\n"
        f"CANDIDATE RESUME:\n{resume_text}"
    )
    return await _call_claude(PROMPTS["interview_prep.txt"], user, max_tokens=1500)
