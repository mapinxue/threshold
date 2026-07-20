import re
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import CurrentUser, DatabaseSession
from app.api.schemas import AuthResponse, LoginRequest, ProfileUpdate, RegisterRequest, UserResponse
from app.db.models import AuthSession, Tenant, User
from app.services.security import hash_password, hash_token, new_token, verify_password

router = APIRouter(prefix="/auth")


def tenant_slug(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "workspace"
    return f"{base[:48]}-{uuid4().hex[:8]}"


async def issue_session(session: DatabaseSession, user: User, tenant: Tenant) -> AuthResponse:
    token = new_token("ths_")
    session.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )
    )
    await session.commit()
    await session.refresh(user)
    return AuthResponse(
        access_token=token,
        tenant_slug=tenant.slug,
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: DatabaseSession) -> AuthResponse:
    tenant = Tenant(slug=tenant_slug(payload.tenant_name), name=payload.tenant_name.strip())
    session.add(tenant)
    await session.flush()
    user = User(
        tenant_id=tenant.id,
        email=payload.email.strip().lower(),
        display_name=payload.display_name.strip(),
        password_hash=hash_password(payload.password),
        role="admin",
    )
    session.add(user)
    try:
        await session.flush()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already exists"
        ) from error
    return await issue_session(session, user, tenant)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, session: DatabaseSession) -> AuthResponse:
    user = await session.scalar(
        select(User).where(func.lower(User.email) == payload.email.strip().lower())
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is disabled")

    tenant = await session.get(Tenant, user.tenant_id)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tenant not found")
    return await issue_session(session, user, tenant)


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: CurrentUser) -> User:
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> User:
    if payload.display_name is not None:
        current_user.display_name = payload.display_name.strip()
    if payload.password is not None:
        current_user.password_hash = hash_password(payload.password)
    await session.commit()
    await session.refresh(current_user)
    return current_user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: CurrentUser, session: DatabaseSession) -> None:
    await session.execute(delete(AuthSession).where(AuthSession.user_id == current_user.id))
    await session.commit()
