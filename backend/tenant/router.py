from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db as get_global_db
from shared.deps import get_current_user
from shared.models.profile import Profile
from tenant.schemas import ConnectDbRequest, ConnectDbResponse, TenantStatusResponse
from tenant.repository import TenantRepository
from tenant.service import encrypt, validate_connection, build_db_url, assert_schema_exists, generate_schema_sql

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.post("/connect", response_model=ConnectDbResponse)
async def connect_database(
    body: ConnectDbRequest,
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_global_db),
):
    valid = await validate_connection(body.supabase_url, body.db_password)
    if not valid:
        raise HTTPException(status_code=400, detail="Could not connect to the database. Check your URL and password.")

    db_url = build_db_url(body.supabase_url, body.db_password)
    await assert_schema_exists(db_url)

    repo = TenantRepository(db)
    await repo.upsert(
        user_id=user.id,
        supabase_url=body.supabase_url,
        db_password_encrypted=encrypt(body.db_password),
    )
    return ConnectDbResponse(ok=True, user_id=str(user.id))


@router.get("/status", response_model=TenantStatusResponse)
async def tenant_status(
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_global_db),
):
    repo = TenantRepository(db)
    tenant = await repo.get_by_user(user.id)
    return TenantStatusResponse(
        connected=tenant is not None,
        supabase_url=tenant.supabase_url if tenant else None,
    )


@router.get("/schema-sql")
async def schema_sql(user: Profile = Depends(get_current_user)):
    sql = generate_schema_sql()
    return {"sql": sql}
