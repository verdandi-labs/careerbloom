from pydantic import BaseModel


class ConnectDbRequest(BaseModel):
    connection_string: str


class TenantStatusResponse(BaseModel):
    connected: bool