from fastapi import APIRouter, HTTPException
from app.schemas import ResumeTailorRequest, ResumeTailorResponse
from app.services import claude

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/tailor", response_model=ResumeTailorResponse)
async def tailor_resume(request: ResumeTailorRequest):
    try:
        result = await claude.tailor_resume(request.resume_text, request.job_description)
        return result
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))
