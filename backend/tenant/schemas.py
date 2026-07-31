from pydantic import BaseModel


class ConnectDbRequest(BaseModel):
    supabase_url: str
    db_password: str


class TenantStatusResponse(BaseModel):
    connected: bool
