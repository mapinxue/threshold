from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import CurrentAdmin, CurrentUser, DatabaseSession
from app.api.schemas import SkillGenerate, SkillResponse
from app.db.models import DataSource, Skill

router = APIRouter(prefix="/skills")


def skill_response(skill: Skill, source_name: str) -> SkillResponse:
    return SkillResponse(
        id=skill.id,
        data_source_id=skill.data_source_id,
        data_source_name=source_name,
        name=skill.name,
        description=skill.description,
        content=skill.content,
        status="ready",
        created_at=skill.created_at,
    )


@router.get("", response_model=list[SkillResponse])
async def list_skills(
    current_user: CurrentUser,
    session: DatabaseSession,
) -> list[SkillResponse]:
    rows = await session.execute(
        select(Skill, DataSource.name)
        .join(DataSource, DataSource.id == Skill.data_source_id)
        .where(Skill.tenant_id == current_user.tenant_id)
        .order_by(Skill.created_at.desc())
    )
    return [skill_response(*row) for row in rows.tuples().all()]


@router.post("/generate", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def generate_skill(
    payload: SkillGenerate,
    current_admin: CurrentAdmin,
    session: DatabaseSession,
) -> SkillResponse:
    source = await session.scalar(
        select(DataSource).where(
            DataSource.id == payload.data_source_id,
            DataSource.tenant_id == current_admin.tenant_id,
        )
    )
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data source not found")

    name = f"query-{source.name.lower().replace(' ', '-')}"
    skill = Skill(
        tenant_id=current_admin.tenant_id,
        data_source_id=source.id,
        name=name[:120],
        description=f"Query {source.name} through the Threshold governed gateway.",
        content=(
            f"# {source.name}\n\n"
            "Use the Threshold API with an API key. Submit read-only SQL and let the gateway "
            f"apply permissions for the {source.engine} data source."
        ),
    )
    session.add(skill)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Skill already exists"
        ) from error
    await session.refresh(skill)
    return skill_response(skill, source.name)
