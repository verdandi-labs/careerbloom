from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from database import ensure_schema, get_db
from shared.crypto import decrypt_user_key, encrypt
from shared.deps import get_current_user
from shared.models.byodb import Byodb
from shared.models.user import User
from tenant.schemas import ConnectDbRequest, TenantStatusResponse
from tenant.service import build_db_url, validate_connection

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.post("/connect", response_model=TenantStatusResponse)
async def connect_database(
    body: ConnectDbRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        valid = await validate_connection(body.connection_string)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid database connection string")
    if not valid:
        raise HTTPException(status_code=400, detail="Could not connect to the database. Check your connection string.")

    user_key = decrypt_user_key(user.encryption_key)
    encrypted_connection = encrypt(body.connection_string, user_key)
    stmt = pg_insert(Byodb).values(user_id=user.user_id, connection=encrypted_connection)
    stmt = stmt.on_conflict_do_update(index_elements=[Byodb.user_id], set_={"connection": encrypted_connection})
    await db.execute(stmt)

    db_url = build_db_url(body.connection_string)
    await ensure_schema(db_url)

    return TenantStatusResponse(connected=True)


@router.get("/status", response_model=TenantStatusResponse)
async def tenant_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Byodb.user_id).where(Byodb.user_id == user.user_id))
    return TenantStatusResponse(connected=result.scalar_one_or_none() is not None)


@router.delete("/disconnect", response_model=TenantStatusResponse)
async def disconnect_database(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(delete(Byodb).where(Byodb.user_id == user.user_id))
    return TenantStatusResponse(connected=False)
