"""
Application configuration.

All values can be overridden via environment variables (see .env.example).
This keeps secrets and environment-specific settings out of source code,
and makes it easy to point the app at a real database / AI service later
without touching business logic.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ---- General ----
    APP_NAME: str = "LabelLens API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"

    # ---- JWT / Auth ----
    JWT_SECRET_KEY: str = "CHANGE_ME_super_secret_dev_key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ---- CORS ----
    # Comma-separated list of allowed origins, configurable via env.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://label-lens.ai.studio"

    # ---- Uploads ----
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_CONTENT_TYPES: List[str] = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    ]

    # ---- Future integration placeholders (not used yet) ----
    SUPABASE_URL: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_JWKS_URL: str = ""
    OCR_API_URL: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
