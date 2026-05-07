from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve .env relative to this file's location (backend/app/core/config.py -> backend/.env)
ENV_FILE = Path(__file__).parent.parent.parent / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediHealth System"
    API_V1_STR: str = "/api/v1"
    
    # SECURITY WARNING: keep the secret key used in production secret!
    SECRET_KEY: str = "super-secret-key-please-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database URL
    # Database URL (Defaults to local SQLite for easier setup)
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # AI API Keys
    GROQ_API_KEY: str = ""
    
    # Azure Storage
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_CONTAINER_NAME: str = "patient-reports"

    model_config = {
        "env_file": str(ENV_FILE),
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
