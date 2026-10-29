import uuid
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.session import RefreshSession
from app.security.hashing import hash_password, verify_password
from app.security.tokens import create_access_token, generate_refresh_token, hash_refresh_token
from app.config import get_settings

settings = get_settings()


def _generate_login_id() -> str:
    return "user_" + secrets.token_hex(6)


async def register_user(
    db: AsyncSession,
    password: str,
    login_id: str | None = None,
) -> tuple[User, str]:
    """Returns (user, raw_login_id)"""
    if login_id is None:
        # Auto-generate, ensure uniqueness
        for _ in range(10):
            candidate = _generate_login_id()
            result = await db.execute(select(User).where(User.login_id == candidate))
            if result.scalar_one_or_none() is None:
                login_id = candidate
                break
        else:
            raise ValueError("Could not generate unique Login ID")
    else:
        # Check uniqueness
        result = await db.execute(select(User).where(User.login_id == login_id))
        if result.scalar_one_or_none() is not None:
            raise ValueError("Login ID already taken")

    pw_hash = hash_password(password)
    user = User(login_id=login_id, password_hash=pw_hash)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user, login_id


async def authenticate_user(db: AsyncSession, login_id: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.login_id == login_id))
    user = result.scalar_one_or_none()
    if user is None:
        # Perform dummy hash to prevent timing attacks
        hash_password("dummy-timing-prevention")
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def create_session(
    db: AsyncSession,
    user_id: uuid.UUID,
    device_id: uuid.UUID | None = None,
) -> tuple[str, str]:
    """Returns (access_token, raw_refresh_token)"""
    dev_id_str = str(device_id) if device_id else str(uuid.uuid4())
    access_token = create_access_token(str(user_id), dev_id_str)
    raw_refresh, hashed_refresh = generate_refresh_token()

    session = RefreshSession(
        user_id=user_id,
        device_id=device_id,
        hashed_session_token=hashed_refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
    )
    db.add(session)
    await db.flush()
    return access_token, raw_refresh


async def refresh_session(db: AsyncSession, raw_token: str) -> tuple[User, str, str] | None:
    """Returns (user, new_access_token, new_raw_refresh) or None"""
    hashed = hash_refresh_token(raw_token)
    result = await db.execute(
        select(RefreshSession).where(
            RefreshSession.hashed_session_token == hashed,
            RefreshSession.revoked_at.is_(None),
            RefreshSession.expires_at > datetime.now(timezone.utc),
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        return None

    # Rotate: revoke old session
    session.revoked_at = datetime.now(timezone.utc)
    await db.flush()

    # Load user
    user_result = await db.execute(select(User).where(User.id == session.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        return None

    # Create new session
    access_token, new_raw = await create_session(db, user.id, session.device_id)
    return user, access_token, new_raw


async def revoke_all_sessions(db: AsyncSession, user_id: uuid.UUID) -> None:
    result = await db.execute(
        select(RefreshSession).where(
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
        )
    )
    sessions = result.scalars().all()
    now = datetime.now(timezone.utc)
    for s in sessions:
        s.revoked_at = now
    await db.flush()
