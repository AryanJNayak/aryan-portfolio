"""
Application configuration.

Purpose:
    Load and validate all environment variables in a single, typed place using
    pydantic-settings. Any module can import the `settings` singleton.

Inputs:
    Environment variables (see `.env.example`), loaded from a local `.env` file.

Output:
    A cached `settings` object of type `Settings`.

Example:
    from app.config import settings
    print(settings.DB_NAME)  # -> "portfolio"
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed container for every environment variable the backend needs."""

    # MongoDB
    MONGODB_URI: str
    DB_NAME: str = "portfolio"

    # Redis (optional — leave empty to use MongoDB cache only)
    # Examples: redis://localhost:6379/0  |  rediss://default:TOKEN@host:6379
    REDIS_URL: str = ""

    # Admin auth / JWT
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # GitHub
    GITHUB_USERNAME: str = "AryanJNayak"
    GITHUB_TOKEN: str = ""

    # LeetCode
    LEETCODE_USERNAME: str = "Jsjsn73"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # SMTP (contact-form email notifications)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    # Optional overrides — defaults: FROM=SMTP_USER, TO=ADMIN_EMAIL
    SMTP_FROM: str = ""
    SMTP_TO: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        """
        Purpose: Turn the comma-separated CORS string into a clean list.
        Output:  list[str] of allowed origins.
        Example: "a,b" -> ["a", "b"]
        """
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """
    Purpose: Build the Settings object once and cache it (avoids re-reading .env).
    Output:  A singleton `Settings` instance.
    """
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
