from pydantic import BaseModel
from uuid import UUID


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: UUID
    display_name: str | None
    onboarding_complete: bool
    preferred_language: str
    cv_template: str

    model_config = {"from_attributes": True}
