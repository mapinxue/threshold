from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuthSession, User
from app.db.session import get_db_session
from app.services.security import hash_token

bearer_scheme = HTTPBearer(auto_error=False)
DatabaseSession = Annotated[AsyncSession, Depends(get_db_session)]
BearerCredentials = Annotated[
    HTTPAuthorizationCredentials | None,
    Depends(bearer_scheme),
]


async def get_current_user(
    session: DatabaseSession,
    credentials: BearerCredentials,
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    statement = (
        select(User)
        .join(AuthSession, AuthSession.user_id == User.id)
        .where(
            AuthSession.token_hash == hash_token(credentials.credentials),
            AuthSession.expires_at > datetime.now(UTC),
            User.status == "active",
        )
    )
    user = await session.scalar(statement)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_admin(current_user: CurrentUser) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


CurrentAdmin = Annotated[User, Depends(get_current_admin)]
