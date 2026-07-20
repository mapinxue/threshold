from fastapi import APIRouter

from app.api.routes.api_keys import router as api_keys_router
from app.api.routes.auth import router as auth_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.data_sources import router as data_sources_router
from app.api.routes.health import router as health_router
from app.api.routes.permissions import router as permissions_router
from app.api.routes.skills import router as skills_router
from app.api.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(auth_router, tags=["authentication"])
api_router.include_router(dashboard_router, tags=["dashboard"])
api_router.include_router(data_sources_router, tags=["data sources"])
api_router.include_router(api_keys_router, tags=["API keys"])
api_router.include_router(users_router, tags=["administration"])
api_router.include_router(permissions_router, tags=["administration"])
api_router.include_router(skills_router, tags=["skills"])
