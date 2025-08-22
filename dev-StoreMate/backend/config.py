from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    LOG_DATABASE_URL: str | None = None
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MEDIA_DIR: str = "media"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

