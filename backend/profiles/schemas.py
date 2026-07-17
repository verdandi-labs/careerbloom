from pydantic import BaseModel
from uuid import UUID


class ProfileResponse(BaseModel):
    id: UUID
    display_name: str | None
    goal: str | None
    onboarding_complete: bool
    preferred_language: str
    career_direction: str | None
    cv_template: str
    cv_photo_url: str | None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    goal: str | None = None
    onboarding_complete: bool | None = None
    preferred_language: str | None = None
    career_direction: str | None = None
    cv_template: str | None = None
    cv_photo_url: str | None = None
