from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import ensure_schema, get_db
from shared.deps import get_current_user
from shared.models.profile import Profile
from shared.models.user import User
from tenant.schemas import ConnectDbRequest, TenantStatusResponse
from tenant.service import build_db_url, validate_connection

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.post("/connect")
async def connect_database(
    body: ConnectDbRequest,
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    valid = await validate_connection(body.supabase_url, body.db_password)
    if not valid:
        raise HTTPException(status_code=400, detail="Could not connect to the database. Check your URL and password.")

    db_url = build_db_url(body.supabase_url, body.db_password)
    await ensure_schema(db_url, user_id=user.id, display_name=user.display_name or "")

    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalars().first()
    db_user.database_url = db_url
    await db.commit()

    return {"message": "Tenant database connected"}


@router.get("/status", response_model=TenantStatusResponse)
async def tenant_status(
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user.id))
    db_user = result.scalars().first()
    return TenantStatusResponse(connected=bool(db_user and db_user.database_url))
