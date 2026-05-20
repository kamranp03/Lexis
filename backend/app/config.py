from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "DB Pro"
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR / 'dbpro.db'}"
    GROQ_API_KEY: str = ""

    class Config:
        env_file = BASE_DIR / ".env.local"


settings = Settings()
