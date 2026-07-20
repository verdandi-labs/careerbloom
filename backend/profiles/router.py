from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.profile import Profile
from profiles.repository import ProfileRepository
from profiles.schemas import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile(user: Profile = Depends(get_current_user)):
    return ProfileResponse.model_validate(user)


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdate,
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = ProfileRepository(db)
    updated = await repo.update(user.id, **body.model_dump(exclude_unset=True))
    return ProfileResponse.model_validate(updated)
