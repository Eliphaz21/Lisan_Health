from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings validated by Pydantic."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # General Application
    PROJECT_NAME: str = "LisanHealth"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"

    # Security & Auth
    SECRET_KEY: str = "development_secret_key_change_in_production_32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"
    ADMIN_EMAIL: str = "eliphazyab@gmail.com"


    # Storage
    UPLOAD_DIR: str = "./storage/uploads"
    AUDIO_OUTPUT_DIR: str = "./storage/audio"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg"
    ]

    # Database
    DATABASE_URL: str = "sqlite:///./lisan_health.db"

    # AI Provider A: Clinical Reasoning
    REASONING_PROVIDER: str = "mock"
    REASONING_API_KEY: str = ""
    REASONING_MODEL: str = "gemini-1.5-flash"
    REASONING_TIMEOUT_SECONDS: int = 30
    REASONING_MAX_RETRIES: int = 2

    # AI Provider B: Addis AI Localization & TTS
    ADDIS_AI_BASE_URL: str = "https://api.addisassistant.com/v1"
    ADDIS_AI_API_KEY: str = ""
    ADDIS_AI_TEXT_MODEL: str = "addis-pro"
    ADDIS_AI_TIMEOUT_SECONDS: int = 30
    ADDIS_AI_MAX_RETRIES: int = 2
    ADDIS_AI_TTS_ENABLED: bool = True
    ADDIS_AI_STT_ENABLED: bool = False
    ADDIS_AI_TTS_DEFAULT_VOICE_AM: str = "hanna"
    ADDIS_AI_TTS_DEFAULT_VOICE_OM: str = "chala"

    # Observability
    PROMETHEUS_METRICS_ENABLED: bool = True


settings = Settings()
