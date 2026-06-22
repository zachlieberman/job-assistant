from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Profile
from app.schemas import ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/profile", tags=["profile"])


async def _get_or_create_profile(db: AsyncSession) -> Profile:
    result = await db.execute(select(Profile).limit(1))
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    try:
        profile = Profile()
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    except IntegrityError:
        await db.rollback()
        result = await db.execute(select(Profile).limit(1))
        return result.scalar_one()


@router.get("", response_model=ProfileResponse)
async def get_profile(db: AsyncSession = Depends(get_db)):
    return await _get_or_create_profile(db)


@router.put("", response_model=ProfileResponse)
async def update_profile(payload: ProfileUpdate, db: AsyncSession = Depends(get_db)):
    profile = await _get_or_create_profile(db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile
