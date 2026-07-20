from typing import cast
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import CurrentAdmin, DatabaseSession
from app.api.schemas import AccessLevel, PermissionCreate, PermissionResponse
from app.db.models import DataSource, Permission, User

router = APIRouter(prefix="/admin/permissions")


def permission_response(
    permission: Permission,
    user_email: str,
    source_name: str,
) -> PermissionResponse:
    return PermissionResponse(
        id=permission.id,
        user_id=permission.user_id,
        user_email=user_email,
        data_source_id=permission.data_source_id,
        data_source_name=source_name,
        access_level=cast(AccessLevel, permission.access_level),
        created_at=permission.created_at,
    )


@router.get("", response_model=list[PermissionResponse])
async def list_permissions(
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> list[PermissionResponse]:
    rows = await session.execute(
        select(Permission, User.email, DataSource.name)
        .join(User, User.id == Permission.user_id)
        .join(DataSource, DataSource.id == Permission.data_source_id)
        .where(Permission.tenant_id == current_admin.tenant_id)
        .order_by(Permission.created_at.desc())
    )
    return [permission_response(*row) for row in rows.tuples().all()]


@router.post("", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    payload: PermissionCreate,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> PermissionResponse:
    user = await session.scalar(
        select(User).where(User.id == payload.user_id, User.tenant_id == current_admin.tenant_id)
    )
    source = await session.scalar(
        select(DataSource).where(
            DataSource.id == payload.data_source_id,
            DataSource.tenant_id == current_admin.tenant_id,
        )
    )
    if user is None or source is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user or source"
        )

    permission = Permission(
        tenant_id=current_admin.tenant_id,
        user_id=user.id,
        data_source_id=source.id,
        access_level=payload.access_level,
    )
    session.add(permission)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Permission exists"
        ) from error
    await session.refresh(permission)
    return permission_response(permission, user.email, source.name)


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: UUID,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> None:
    permission = await session.scalar(
        select(Permission).where(
            Permission.id == permission_id,
            Permission.tenant_id == current_admin.tenant_id,
        )
    )
    if permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    await session.delete(permission)
    await session.commit()
