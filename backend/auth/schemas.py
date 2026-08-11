from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserResponse(BaseModel):
    user_id: UUID
    email: str | None
    auth_method: str
    onboarding: bool
    created_at: datetime

    model_config = {"from_attributes": True}
