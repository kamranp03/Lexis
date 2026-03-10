from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "DB Pro"
    DATABASE_URL: str = f"sqlite+aiosqlite:///{Path(__file__).parent.parent / 'dbpro.db'}"
    GROQ_API_KEY: str = "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"

    class Config:
        env_file = ".env"


settings = Settings()
