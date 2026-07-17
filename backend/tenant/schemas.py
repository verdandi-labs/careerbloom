from pydantic import BaseModel


class ConnectDbRequest(BaseModel):
    supabase_url: str
    db_password: str


class ConnectDbResponse(BaseModel):
    ok: bool
    user_id: str


class TenantStatusResponse(BaseModel):
    connected: bool
    supabase_url: str | None = None
