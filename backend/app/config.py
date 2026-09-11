"""
App settings, loaded from environment variables (or a local .env file).
Using pydantic-settings so values are validated and typed.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Postgres connection string, e.g.
    # postgresql+asyncpg://stockflow:stockflow@db:5432/stockflow
    database_url: str = "postgresql+asyncpg://stockflow:stockflow@localhost:5432/stockflow"

    # JWT settings (used in later sessions when auth is built)
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
