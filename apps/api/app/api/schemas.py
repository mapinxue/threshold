from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

UserRole = Literal["admin", "user"]
UserStatus = Literal["active", "disabled"]
DataSourceStatus = Literal["draft", "connected", "disabled"]
AccessLevel = Literal["read", "write", "admin"]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    email: str
    display_name: str
    role: UserRole
    status: UserStatus
    created_at: datetime


class RegisterRequest(BaseModel):
    tenant_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    tenant_slug: str
    user: UserResponse


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=120)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class AdminUserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = "user"


class UserStatusUpdate(BaseModel):
    status: UserStatus


class DataSourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    engine: str = Field(min_length=1, max_length=40)
    host: str | None = Field(default=None, max_length=255)
    port: int | None = Field(default=None, ge=1, le=65535)
    database_name: str | None = Field(default=None, max_length=120)
    credential_ref: str | None = Field(default=None, max_length=255)
    owner_user_id: UUID | None = None
    status: DataSourceStatus = "draft"


class DataSourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    engine: str | None = Field(default=None, min_length=1, max_length=40)
    host: str | None = Field(default=None, max_length=255)
    port: int | None = Field(default=None, ge=1, le=65535)
    database_name: str | None = Field(default=None, max_length=120)
    credential_ref: str | None = Field(default=None, max_length=255)
    owner_user_id: UUID | None = None
    status: DataSourceStatus | None = None


class DataSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    owner_user_id: UUID | None
    name: str
    engine: str
    host: str | None
    port: int | None
    database_name: str | None
    credential_ref: str | None
    status: DataSourceStatus
    created_at: datetime


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class ApiKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    key_prefix: str
    last_used_at: datetime | None
    created_at: datetime


class ApiKeyCreated(ApiKeyResponse):
    secret: str


class PermissionCreate(BaseModel):
    user_id: UUID
    data_source_id: UUID
    access_level: AccessLevel = "read"


class PermissionResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_email: str
    data_source_id: UUID
    data_source_name: str
    access_level: AccessLevel
    created_at: datetime


class SkillGenerate(BaseModel):
    data_source_id: UUID


class SkillResponse(BaseModel):
    id: UUID
    data_source_id: UUID
    data_source_name: str
    name: str
    description: str
    content: str
    status: Literal["ready"]
    created_at: datetime


class DashboardResponse(BaseModel):
    users: int
    data_sources: int
    api_keys: int
    permissions: int
    skills: int
