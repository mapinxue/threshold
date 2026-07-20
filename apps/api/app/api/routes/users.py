from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import CurrentAdmin, DatabaseSession
from app.api.schemas import AdminUserCreate, UserResponse, UserStatusUpdate
from app.db.models import User
from app.services.security import hash_password

router = APIRouter(prefix="/admin/users")


@router.get("", response_model=list[UserResponse])
async def list_users(current_admin: CurrentAdmin, session: DatabaseSession) -> list[User]:
    users = await session.scalars(
        select(User).where(User.tenant_id == current_admin.tenant_id).order_by(User.created_at)
    )
    return list(users)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: AdminUserCreate,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> User:
    user = User(
        tenant_id=current_admin.tenant_id,
        email=payload.email.strip().lower(),
        display_name=payload.display_name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already exists"
        ) from error
    await session.refresh(user)
    return user


async def tenant_user_or_404(user_id: UUID, admin: User, session: DatabaseSession) -> User:
    user = await session.scalar(
        select(User).where(User.id == user_id, User.tenant_id == admin.tenant_id)
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> User:
    user = await tenant_user_or_404(user_id, current_admin, session)
    if user.id == current_admin.id and payload.status == "disabled":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot disable yourself")
    user.status = payload.status
    await session.commit()
    await session.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> None:
    user = await tenant_user_or_404(user_id, current_admin, session)
    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cannot delete yourself")
    await session.delete(user)
    await session.commit()
