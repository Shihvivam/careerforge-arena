"""
app/core/config.py
Central configuration loaded from environment variables.
All secrets come from .env — nothing is hardcoded.
"""

import os
import secrets
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── App ───────────────────────────────────────────────────────────────
    APP_NAME: str      = "CareerForge Arena API"
    APP_VERSION: str   = "2.0.0"
    APP_ENV: str       = os.getenv("APP_ENV", "development")
    DEBUG: bool        = APP_ENV == "development"

    # ── Security ──────────────────────────────────────────────────────────
    SECRET_KEY: str    = os.getenv("SECRET_KEY", secrets.token_hex(32))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    # Access token: 24h default; refresh token: 7d
    ACCESS_TOKEN_EXPIRE_MINUTES: int  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES",  "1440"))
    REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))

    # bcrypt work factor (12 = ~300ms on modern hardware)
    BCRYPT_ROUNDS: int = int(os.getenv("BCRYPT_ROUNDS", "12"))

    # ── MongoDB ───────────────────────────────────────────────────────────
    MONGODB_URL: str   = os.getenv("MONGODB_URL", "")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "careerforge")

    # ── CORS ──────────────────────────────────────────────────────────────
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # ── Validation ────────────────────────────────────────────────────────
    def validate(self) -> None:
        errors = []
        if not self.MONGODB_URL:
            errors.append("MONGODB_URL is required")
        if self.SECRET_KEY in ("", "changeme", "secret"):
            errors.append("SECRET_KEY must be set to a secure random value")
        if errors:
            raise EnvironmentError(
                "Configuration errors:\n" + "\n".join(f"  • {e}" for e in errors)
            )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    s = Settings()
    if s.APP_ENV == "production":
        s.validate()
    return s
settings = get_settings()


# Append new settings to the Settings class (patch at module level)
import os as _os

Settings.MAIL_USERNAME   = _os.getenv("MAIL_USERNAME",   "")
Settings.MAIL_PASSWORD   = _os.getenv("MAIL_PASSWORD",   "")
Settings.MAIL_FROM       = _os.getenv("MAIL_FROM",       "")
Settings.MAIL_FROM_NAME  = _os.getenv("MAIL_FROM_NAME",  "CareerForge Arena")
Settings.MAIL_SERVER     = _os.getenv("MAIL_SERVER",     "smtp.gmail.com")
Settings.MAIL_PORT       = int(_os.getenv("MAIL_PORT",   "587"))
Settings.FRONTEND_URL    = _os.getenv("FRONTEND_URL",    "http://localhost:5173")
Settings.EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS = int(
    _os.getenv("EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS", "86400")
)
settings = get_settings()

