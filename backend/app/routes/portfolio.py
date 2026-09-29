from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth import require_auth
from app.database import get_db
from app.services.deploy_hook import rebuild_on_success
from app.models import PortfolioBio, PortfolioExperience, PortfolioProject
from app.schemas import (
    PortfolioBioResponse,
    PortfolioBioUpdate,
    PortfolioExperienceCreate,
    PortfolioExperienceResponse,
    PortfolioExperienceUpdate,
    PortfolioProjectCreate,
    PortfolioProjectResponse,
    PortfolioProjectUpdate,
)

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

# Every write needs auth, and a successful one queues a rebuild of the prerendered public site.
WRITE_DEPENDENCIES = [Depends(require_auth), Depends(rebuild_on_success)]


# Fixed primary key for the singleton bio row so a concurrent duplicate
# insert actually violates a constraint (PortfolioBio otherwise has no
# unique constraint to race against, which made the IntegrityError guard
# below a no-op).
_BIO_SINGLETON_ID = 1


async def _get_or_create_bio(db: AsyncSession) -> PortfolioBio:
    result = await db.execute(select(PortfolioBio).where(PortfolioBio.id == _BIO_SINGLETON_ID))
    bio = result.scalar_one_or_none()
    if bio:
        return bio
    try:
        bio = PortfolioBio(id=_BIO_SINGLETON_ID)
        db.add(bio)
        await db.commit()
        await db.refresh(bio)
        return bio
    except IntegrityError:
        await db.rollback()
        result = await db.execute(select(PortfolioBio).where(PortfolioBio.id == _BIO_SINGLETON_ID))
        return result.scalar_one()


@router.get("/bio", response_model=PortfolioBioResponse)
async def get_bio(db: AsyncSession = Depends(get_db)):
    return await _get_or_create_bio(db)


@router.put("/bio", response_model=PortfolioBioResponse, dependencies=WRITE_DEPENDENCIES)
async def update_bio(payload: PortfolioBioUpdate, db: AsyncSession = Depends(get_db)):
    bio = await _get_or_create_bio(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(bio, field, value)
    await db.commit()
    await db.refresh(bio)
    return bio


@router.get("/projects", response_model=List[PortfolioProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortfolioProject).order_by(PortfolioProject.sort_order))
    return result.scalars().all()


@router.post(
    "/projects",
    response_model=PortfolioProjectResponse,
    status_code=201,
    dependencies=WRITE_DEPENDENCIES,
)
async def create_project(payload: PortfolioProjectCreate, db: AsyncSession = Depends(get_db)):
    project = PortfolioProject(**payload.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.put(
    "/projects/{project_id}",
    response_model=PortfolioProjectResponse,
    dependencies=WRITE_DEPENDENCIES,
)
async def update_project(
    project_id: int, payload: PortfolioProjectUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PortfolioProject).where(PortfolioProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


@router.delete("/projects/{project_id}", status_code=204, dependencies=WRITE_DEPENDENCIES)
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortfolioProject).where(PortfolioProject.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()


@router.get("/experience", response_model=List[PortfolioExperienceResponse])
async def list_experience(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PortfolioExperience).order_by(PortfolioExperience.sort_order))
    return result.scalars().all()


@router.post(
    "/experience",
    response_model=PortfolioExperienceResponse,
    status_code=201,
    dependencies=WRITE_DEPENDENCIES,
)
async def create_experience(payload: PortfolioExperienceCreate, db: AsyncSession = Depends(get_db)):
    entry = PortfolioExperience(**payload.model_dump())
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put(
    "/experience/{experience_id}",
    response_model=PortfolioExperienceResponse,
    dependencies=WRITE_DEPENDENCIES,
)
async def update_experience(
    experience_id: int, payload: PortfolioExperienceUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PortfolioExperience).where(PortfolioExperience.id == experience_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Experience entry not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete(
    "/experience/{experience_id}", status_code=204, dependencies=WRITE_DEPENDENCIES
)
async def delete_experience(experience_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PortfolioExperience).where(PortfolioExperience.id == experience_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Experience entry not found")
    await db.delete(entry)
    await db.commit()
