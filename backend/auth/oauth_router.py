from authlib.integrations.base_client.errors import MismatchingStateError
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth.service import create_session, create_user
from config import get_settings
from database import get_db
from shared.deps import SESSION_COOKIE

router = APIRouter(prefix="/auth/oauth", tags=["auth"])
settings = get_settings()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
oauth.register(
    name="github",
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    authorize_url="https://github.com/login/oauth/authorize",
    access_token_url="https://github.com/login/oauth/access_token",
    userinfo_endpoint="https://api.github.com/user",
    client_kwargs={"scope": "user:email"},
)


def _callback_uri(request: Request, provider: str) -> str:
    base = str(request.base_url).rstrip("/")
    if "localhost" not in base and "127.0.0.1" not in base:
        base = base.replace("http://", "https://", 1)
    return f"{base}{settings.API_V1_PREFIX}/auth/oauth/{provider}/callback"


def _set_session_cookie(response: RedirectResponse, raw_token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        raw_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )


async def _handle_callback(
    request: Request, db: AsyncSession, provider: str
) -> RedirectResponse:
    client = oauth.create_client(provider)
    try:
        token = await client.authorize_access_token(request)
        user_info = await client.userinfo(token=token)
    except MismatchingStateError:
        return RedirectResponse("/auth?error=state_mismatch")

    provider_id = str(
        user_info.get("sub") if provider == "google" else user_info.get("id")
    )
    try:
        user = await create_user(db, provider, provider_id, user_info.get("email"))
    except ValueError as exc:
        if str(exc) == "email_registered_with_different_provider":
            return RedirectResponse("/auth?error=email_exists")
        raise
    raw_session = await create_session(db, user.user_id)
    await db.commit()

    target = "/dashboard" if user.onboarding else "/onboarding"
    response = RedirectResponse(target)
    _set_session_cookie(response, raw_session)
    return response


@router.get("/google")
async def oauth_google(request: Request):
    return await oauth.google.authorize_redirect(
        request, _callback_uri(request, "google")
    )


@router.get("/google/callback")
async def oauth_google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    return await _handle_callback(request, db, "google")


@router.get("/github")
async def oauth_github(request: Request):
    return await oauth.github.authorize_redirect(
        request, _callback_uri(request, "github")
    )


@router.get("/github/callback")
async def oauth_github_callback(request: Request, db: AsyncSession = Depends(get_db)):
    return await _handle_callback(request, db, "github")
