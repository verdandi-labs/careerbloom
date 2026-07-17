from uuid import uuid4
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from database import get_db
from shared.deps import get_current_user
from shared.models.profile import Profile
from auth.schemas import TokenResponse, UserResponse
from config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return None


@router.get("/authentik/login")
async def authentik_login():
    """Redirect to Authentik's authorize endpoint."""
    params = {
        "client_id": settings.AUTHENTIK_CLIENT_ID,
        "redirect_uri": settings.AUTHENTIK_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid profile email",
        "state": str(uuid4()),
    }
    authorize_url = f"{settings.AUTHENTIK_ENDPOINT}/authorize?{urlencode(params)}"
    return RedirectResponse(url=authorize_url)


@router.get("/authentik/callback")
async def authentik_callback(
    code: str = Query(...),
    state: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Exchange Authentik authorization code for tokens, create/update user, redirect to frontend with JWT."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            f"{settings.AUTHENTIK_ENDPOINT}/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.AUTHENTIK_REDIRECT_URI,
                "client_id": settings.AUTHENTIK_CLIENT_ID,
                "client_secret": settings.AUTHENTIK_CLIENT_SECRET,
            },
        )

    if token_resp.status_code != 200:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth?error=token_exchange_failed")

    tokens = token_resp.json()
    access_token = tokens.get("access_token")

    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            f"{settings.AUTHENTIK_ENDPOINT}/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if userinfo_resp.status_code != 200:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth?error=userinfo_failed")

    userinfo = userinfo_resp.json()
    authentik_sub = userinfo.get("sub")
    email = userinfo.get("email")
    name = userinfo.get("name") or userinfo.get("preferred_username")

    result = await db.execute(select(Profile).where(Profile.id == authentik_sub))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = Profile(
            id=authentik_sub,
            display_name=name or (email.split("@")[0] if email else "User"),
        )
        db.add(profile)
        await db.flush()

    access = create_access_token(str(profile.id))
    refresh = create_refresh_token(str(profile.id))

    redirect_url = (
        f"{settings.FRONTEND_URL}/auth/callback"
        f"#access_token={access}&refresh_token={refresh}"
    )
    return RedirectResponse(url=redirect_url)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str = Query(...), db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(Profile).where(Profile.id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access = create_access_token(str(profile.id))
    new_refresh = create_refresh_token(str(profile.id))
    return TokenResponse(
        access_token=access,
        refresh_token=new_refresh,
        user=UserResponse.model_validate(profile),
    )


@router.post("/logout")
async def logout():
    return {"ok": True}


@router.get("/me", response_model=UserResponse)
async def me(profile: Profile = Depends(get_current_user)):
    return UserResponse.model_validate(profile)
