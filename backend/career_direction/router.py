from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from career_direction.repository import CareerDirectionRepository
from career_direction.schemas import CareerDirectionCreate, CareerDirectionResponse
from shared.crypto import decrypt, decrypt_user_key, encrypt
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User

router = APIRouter(prefix="/career-direction", tags=["career-direction"])


def _cipher(user: User, plaintext: str) -> str:
    user_key = decrypt_user_key(user.encryption_key)
    return encrypt(plaintext, user_key)


def _plaintext(user: User, ciphertext: str) -> str:
    user_key = decrypt_user_key(user.encryption_key)
    return decrypt(ciphertext, user_key)


@router.post("", response_model=CareerDirectionResponse)
async def create_career_direction(
    body: CareerDirectionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = CareerDirectionRepository(db)
    encrypted = _cipher(user, body.summary)
    career_direction = await repo.create_or_rotate(user.user_id, encrypted)
    career_direction.summary = _plaintext(user, career_direction.summary)
    return CareerDirectionResponse.model_validate(career_direction)


@router.get("", response_model=list[CareerDirectionResponse])
async def list_career_directions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = CareerDirectionRepository(db)
    career_directions = await repo.get_all(user.user_id)
    user_key = decrypt_user_key(user.encryption_key)
    for career_direction in career_directions:
        career_direction.summary = decrypt(career_direction.summary, user_key)
    return [CareerDirectionResponse.model_validate(cd) for cd in career_directions]


@router.get("/current", response_model=CareerDirectionResponse)
async def get_current_career_direction(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = CareerDirectionRepository(db)
    career_direction = await repo.get_latest(user.user_id)
    if not career_direction:
        raise HTTPException(status_code=404, detail="Career direction not found")
    career_direction.summary = _plaintext(user, career_direction.summary)
    return CareerDirectionResponse.model_validate(career_direction)


@router.delete("/{career_direction_id}")
async def delete_career_direction(
    career_direction_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
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
