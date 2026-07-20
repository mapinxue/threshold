from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DatabaseSession
from app.api.schemas import DashboardResponse
from app.db.models import ApiKey, DataSource, Permission, Skill, User

router = APIRouter(prefix="/dashboard")


@router.get("", response_model=DashboardResponse)
async def dashboard(current_user: CurrentUser, session: DatabaseSession) -> DashboardResponse:
    users = await session.scalar(
        select(func.count()).select_from(User).where(User.tenant_id == current_user.tenant_id)
    )
    sources = await session.scalar(
        select(func.count())
        .select_from(DataSource)
        .where(DataSource.tenant_id == current_user.tenant_id)
    )
    permissions = await session.scalar(
        select(func.count())
        .select_from(Permission)
        .where(Permission.tenant_id == current_user.tenant_id)
    )
    skills = await session.scalar(
        select(func.count()).select_from(Skill).where(Skill.tenant_id == current_user.tenant_id)
    )
    keys = await session.scalar(
        select(func.count()).select_from(ApiKey).where(ApiKey.user_id == current_user.id)
    )
    return DashboardResponse(
        users=users or 0,
        data_sources=sources or 0,
        api_keys=keys or 0,
        permissions=permissions or 0,
        skills=skills or 0,
    )
