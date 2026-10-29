from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/privatechat"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me-to-a-long-random-secret-at-least-64-chars"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    allowed_origins: str = "http://localhost:5173"
    environment: str = "development"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
