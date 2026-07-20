from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="THRESHOLD_",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Threshold API"
    app_version: str = "0.1.0"
    environment: Literal["development", "test", "staging", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    database_url: str = "postgresql+psycopg://threshold:threshold@localhost:5432/threshold"
    database_echo: bool = False
    database_connect_timeout_seconds: float = 3.0
    cors_origins: list[AnyHttpUrl] = Field(
        default_factory=lambda: [AnyHttpUrl("http://localhost:3000")]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
