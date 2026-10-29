import uuid
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import register_user, authenticate_user, create_session, refresh_session
from app.security.rate_limit import limiter
from app.config import get_settings
from app.api.v1.deps import get_current_user_and_device
from app.websocket.ticket import ticket_store
from app.models.user import User

router = APIRouter()
settings = get_settings()

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = settings.refresh_token_expire_days * 86400


def _set_refresh_cookie(response: Response, token: str) -> None:
    is_prod = settings.environment == "production"
    # In production, frontend & backend can be hosted on different subdomains/domains (e.g. .onrender.com).
    # SameSite=None and Secure=True are required for modern browsers to send cross-origin cookies.
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )


@router.post("/register", status_code=201)
@limiter.limit("30/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        user, login_id = await register_user(db, body.password, body.login_id)
        access_token, raw_refresh = await create_session(db, user.id, None)
        await db.commit()
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    _set_refresh_cookie(response, raw_refresh)
    return {
        "user": {
            "id": str(user.id),
            "login_id": user.login_id,
            "status": user.status.value,
            "created_at": user.created_at.isoformat(),
        },
        "access_token": access_token,
        "device_id": None,
    }


@router.post("/login")
@limiter.limit("60/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, body.login_id, body.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid Login ID or password")

    access_token, raw_refresh = await create_session(db, user.id, None)
    await db.commit()

    _set_refresh_cookie(response, raw_refresh)
    return {
        "user": {
            "id": str(user.id),
            "login_id": user.login_id,
            "status": user.status.value,
            "created_at": user.created_at.isoformat(),
        },
        "access_token": access_token,
        "device_id": None,
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token session")

    result = await refresh_session(db, refresh_token)
    if result is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    user, access_token, new_raw = result
    await db.commit()

    _set_refresh_cookie(response, new_raw)
    return {
        "user": {
            "id": str(user.id),
            "login_id": user.login_id,
            "status": user.status.value,
            "created_at": user.created_at.isoformat(),
        },
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/ws-ticket")
async def create_ws_ticket(
    user_and_device: tuple[User, str] = Depends(get_current_user_and_device),
):
    """
    Generates a short-lived (45 seconds), single-use WebSocket ticket.
    Prevents leaking long-lived tokens into query strings or HTTP access logs.
    """
    user, device_id = user_and_device
    ticket = ticket_store.issue_ticket(user_id=str(user.id), device_id=device_id)
    return {
        "ticket": ticket,
        "expires_in": ticket_store.ttl,
    }


@router.post("/logout")
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if refresh_token:
        from app.security.tokens import hash_refresh_token
        from app.models.session import RefreshSession
        from sqlalchemy import select
        from datetime import datetime, timezone
        hashed = hash_refresh_token(refresh_token)
        result = await db.execute(
            select(RefreshSession).where(RefreshSession.hashed_session_token == hashed)
        )
        session = result.scalar_one_or_none()
        if session and session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)
            await db.commit()

    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")
    return {"message": "Logged out successfully"}
