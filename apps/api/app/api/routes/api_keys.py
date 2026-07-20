from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DatabaseSession
from app.api.schemas import ApiKeyCreate, ApiKeyCreated, ApiKeyResponse
from app.db.models import ApiKey
from app.services.security import hash_token, new_token

router = APIRouter(prefix="/api-keys")


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(current_user: CurrentUser, session: DatabaseSession) -> list[ApiKey]:
    keys = await session.scalars(
        select(ApiKey).where(ApiKey.user_id == current_user.id).order_by(ApiKey.created_at.desc())
    )
    return list(keys)


@router.post("", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: ApiKeyCreate,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> ApiKeyCreated:
    secret = new_token("thk_")
    api_key = ApiKey(
        user_id=current_user.id,
        name=payload.name.strip(),
        key_prefix=secret[:12],
        key_hash=hash_token(secret),
    )
    session.add(api_key)
    await session.commit()
    await session.refresh(api_key)
    response = ApiKeyResponse.model_validate(api_key)
    return ApiKeyCreated(**response.model_dump(), secret=secret)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: UUID,
    current_user: CurrentUser,
    session: DatabaseSession,
) -> None:
    api_key = await session.scalar(
        select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    )
    if api_key is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
    await session.delete(api_key)
    await session.commit()
