from fastapi import APIRouter, HTTPException
from app.schemas import CoverLetterRequest, CoverLetterResponse
from app.services import claude

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])


@router.post("/generate", response_model=CoverLetterResponse)
async def generate_cover_letter(request: CoverLetterRequest):
    try:
        result = await claude.generate_cover_letter(
            request.resume_text,
            request.job_description,
            request.company_name,
            request.tone,
        )
        return result
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))
