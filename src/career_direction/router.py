from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from career_direction.repository import CareerDirectionRepository
from career_direction.schemas import CareerDirectionCreate, CareerDirectionResponse
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User

router = APIRouter(prefix="/career-direction", tags=["career-direction"])


@router.post("", response_model=CareerDirectionResponse)
async def create_career_direction(
    body: CareerDirectionCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = CareerDirectionRepository(db)
    career_direction = await repo.create_or_rotate(user.user_id, body.summary)
    return CareerDirectionResponse.model_validate(career_direction)


@router.get("", response_model=list[CareerDirectionResponse])
async def list_career_directions(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = CareerDirectionRepository(db)
    career_directions = await repo.get_all(user.user_id)
    return [CareerDirectionResponse.model_validate(cd) for cd in career_directions]


@router.get("/current", response_model=CareerDirectionResponse)
async def get_current_career_direction(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = CareerDirectionRepository(db)
    career_direction = await repo.get_latest(user.user_id)
    if not career_direction:
        raise HTTPException(status_code=404, detail="Career direction not found")
    return CareerDirectionResponse.model_validate(career_direction)


@router.delete("/{career_direction_id}")
async def delete_career_direction(
    career_direction_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    try:
        parsed = UUID(career_direction_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Career direction not found")

    repo = CareerDirectionRepository(db)
    deleted = await repo.delete(user.user_id, parsed)
    if not deleted:
        raise HTTPException(status_code=404, detail="Career direction not found")
    return {"ok": True}
