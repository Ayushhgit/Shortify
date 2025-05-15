import os
import pathlib
from typing import Optional, Dict, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # General
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Shortify"

    # Storage
    STORAGE_TYPE: str = "local"  # options: local, s3
    UPLOAD_DIR: pathlib.Path = pathlib.Path("uploads").resolve()
    ORIGINALS_DIR: pathlib.Path = UPLOAD_DIR / "originals"
    CLIPS_DIR: pathlib.Path = UPLOAD_DIR / "clips"

    # S3 (optional)
    S3_ENDPOINT: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    S3_REGION: Optional[str] = "us-east-1"

    # Redis and Celery
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # AI Services
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    USE_GPT: Optional[bool] = None
    USE_WHISPER: Optional[bool] = None

    # Video Clip Settings
    MIN_CLIP_DURATION: int = 5  # in seconds
    MAX_CLIP_DURATION: int = 60  # in seconds
    MAX_CLIPS: int = 4

    # Authentication
    USE_GOOGLE_AUTH: bool = False
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # ---------- VALIDATORS ----------

    @field_validator("STORAGE_TYPE")
    def validate_storage_type(cls, v: str) -> str:
        allowed = {"local", "s3"}
        if v not in allowed:
            raise ValueError(f"Invalid STORAGE_TYPE: {v}. Must be one of {allowed}")
        return v

    @field_validator("UPLOAD_DIR", "ORIGINALS_DIR", "CLIPS_DIR", mode="before")
    def ensure_directories_exist(cls, v) -> pathlib.Path:
        path= pathlib.Path(v).resolve()  # Convert to pathlib.Path and resolve
        path.mkdir(parents=True, exist_ok=True)  # Create dir if needed
        return path


    @field_validator("CELERY_BROKER_URL", mode="before")
    def default_celery_broker(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if v:
            return v
        return f"redis://{values.get('REDIS_HOST', 'localhost')}:{values.get('REDIS_PORT', 6379)}/0"

    @field_validator("CELERY_RESULT_BACKEND", mode="before")
    def default_celery_backend(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        if v:
            return v
        return f"redis://{values.get('REDIS_HOST', 'localhost')}:{values.get('REDIS_PORT', 6379)}/0"

    @field_validator("USE_GPT", mode="before")
    def enable_gpt_if_key_exists(cls, v: Optional[bool], values: Dict[str, Any]) -> bool:
        return bool(values.get("OPENAI_API_KEY")) if v is None else v

    @field_validator("USE_WHISPER", mode="before")
    def enable_whisper_if_key_exists(cls, v: Optional[bool], values: Dict[str, Any]) -> bool:
        return bool(values.get("OPENAI_API_KEY")) if v is None else v

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = 'utf-8'


settings = Settings()
