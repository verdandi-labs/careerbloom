from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import ensure_schema, get_db
from shared.deps import get_current_user
from shared.models.user import User
from tenant.schemas import ConnectDbRequest, TenantStatusResponse
from tenant.service import build_db_url, validate_connection

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.post("/connect")
async def connect_database(
    body: ConnectDbRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    valid = await validate_connection(body.connection_string)
    if not valid:
        raise HTTPException(status_code=400, detail="Could not connect to the database. Check your connection string.")

    db_url = build_db_url(body.connection_string)
    await ensure_schema(db_url, user_id=user.user_id)

    return {"message": "Database connected successfully"}


@router.get("/status", response_model=TenantStatusResponse)
async def tenant_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return TenantStatusResponse(connected=False)
