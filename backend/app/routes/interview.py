from fastapi import APIRouter, HTTPException
from app.schemas import InterviewPrepRequest, InterviewPrepResponse
from app.services import claude

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/prep", response_model=InterviewPrepResponse)
async def interview_prep(request: InterviewPrepRequest):
    try:
        result = await claude.generate_interview_prep(
            request.job_description,
            request.resume_text,
            request.question_types,
        )
        return result
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))
