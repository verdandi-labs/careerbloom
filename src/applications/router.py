from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from applications.repository import ApplicationRepository
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User

router = APIRouter(prefix="/applications", tags=["applications"])


class ApplicationCreate(BaseModel):
    job_title: str | None = None
    company_name: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def save_application(
    body: ApplicationCreate,
    response: Response,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = ApplicationRepository(db)
    application = await repo.create_if_not_duplicate(
        user.user_id,
        body.job_title,
        body.company_name,
    )
    if application is None:
        response.status_code = status.HTTP_200_OK
        return {"created": False}
    return {"created": True, "application_id": str(application.id)}
