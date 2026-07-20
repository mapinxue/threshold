from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import CurrentAdmin, CurrentUser, DatabaseSession
from app.api.schemas import DataSourceCreate, DataSourceResponse, DataSourceUpdate
from app.db.models import DataSource, Permission, User

router = APIRouter(prefix="/data-sources")


@router.get("", response_model=list[DataSourceResponse])
async def list_data_sources(
    current_user: CurrentUser,
    session: DatabaseSession,
) -> list[DataSource]:
    statement = select(DataSource).where(DataSource.tenant_id == current_user.tenant_id)
    if current_user.role != "admin":
        granted_sources = select(Permission.data_source_id).where(
            Permission.user_id == current_user.id
        )
        statement = statement.where(
            or_(
                DataSource.owner_user_id == current_user.id,
                DataSource.id.in_(granted_sources),
            )
        )
    sources = await session.scalars(statement.order_by(DataSource.created_at.desc()))
    return list(sources)


async def source_or_404(source_id: UUID, admin: User, session: DatabaseSession) -> DataSource:
    source = await session.scalar(
        select(DataSource).where(
            DataSource.id == source_id,
            DataSource.tenant_id == admin.tenant_id,
        )
    )
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")
    return source


async def validate_owner(owner_id: UUID | None, admin: User, session: DatabaseSession) -> None:
    if owner_id is None:
        return
    owner = await session.scalar(
        select(User.id).where(User.id == owner_id, User.tenant_id == admin.tenant_id)
    )
    if owner is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner not found")


@router.post("", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_data_source(
    payload: DataSourceCreate,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> DataSource:
    await validate_owner(payload.owner_user_id, current_admin, session)
    source = DataSource(
        tenant_id=current_admin.tenant_id,
        owner_user_id=payload.owner_user_id,
        name=payload.name.strip(),
        engine=payload.engine.strip().lower(),
        host=payload.host,
        port=payload.port,
        database_name=payload.database_name,
        credential_ref=payload.credential_ref,
        status=payload.status,
    )
    session.add(source)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Data source name exists"
        ) from error
    await session.refresh(source)
    return source


@router.patch("/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: UUID,
    payload: DataSourceUpdate,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> DataSource:
    source = await source_or_404(source_id, current_admin, session)
    values = payload.model_dump(exclude_unset=True)
    if "owner_user_id" in values:
        await validate_owner(payload.owner_user_id, current_admin, session)
    for field, value in values.items():
        setattr(source, field, value.strip() if isinstance(value, str) else value)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Data source name exists"
        ) from error
    await session.refresh(source)
    return source


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(
    source_id: UUID,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> None:
    source = await source_or_404(source_id, current_admin, session)
    await session.delete(source)
    await session.commit()
