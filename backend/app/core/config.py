"""
app/core/config.py  —  Single source of truth for all configuration.
Everything comes from environment variables loaded via python-dotenv.
"""

import os
import secrets
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ── App ───────────────────────────────────────────────────────────────
    APP_NAME:    str  = "CareerForge Arena API"
    APP_VERSION: str  = "2.0.0"
    APP_ENV:     str  = os.getenv("APP_ENV", "development")
    DEBUG:       bool = os.getenv("APP_ENV", "development") == "development"

    # ── JWT ───────────────────────────────────────────────────────────────
    SECRET_KEY:    str = os.getenv("SECRET_KEY", secrets.token_hex(32))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES:  int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES",  "1440"))
    REFRESH_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", "10080"))
    BCRYPT_ROUNDS: int = int(os.getenv("BCRYPT_ROUNDS", "12"))

    # ── MongoDB ───────────────────────────────────────────────────────────
    MONGODB_URL:    str = os.getenv("MONGODB_URL", "")
    MONGO_DB_NAME:  str = os.getenv("MONGO_DB_NAME", "careerforge")

    # ── CORS ──────────────────────────────────────────────────────────────
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    FRONTEND_URL:    str = os.getenv("FRONTEND_URL",    "http://localhost:5173")

    # ── Gmail SMTP ────────────────────────────────────────────────────────
    # Use a Gmail App Password — NOT your real Gmail password.
    # Generate at: https://myaccount.google.com/apppasswords
    MAIL_USERNAME:  str = os.getenv("MAIL_USERNAME",  "")
    MAIL_PASSWORD:  str = os.getenv("MAIL_PASSWORD",  "")
    MAIL_FROM:      str = os.getenv("MAIL_FROM",      "")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "CareerForge Arena")
    MAIL_SERVER:    str = os.getenv("MAIL_SERVER",    "smtp.gmail.com")
    MAIL_PORT:      int = int(os.getenv("MAIL_PORT",  "587"))  # 587=STARTTLS, 465=SSL

    # ── Email verification ─────────────────────────────────────────────────
    EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS: int = int(
        os.getenv("EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS", "86400")  # 24h
    )

    # ── Dev helpers ────────────────────────────────────────────────────────
    # In development, print verification links to the console even if SMTP fails
    EMAIL_CONSOLE_FALLBACK: bool = os.getenv("EMAIL_CONSOLE_FALLBACK", "true").lower() == "true"

    def validate(self) -> None:
        """Called in production to ensure all required vars are set."""
        errors = []
        if not self.MONGODB_URL:
            errors.append("MONGODB_URL is required")
        if self.SECRET_KEY in ("", "changeme", "secret"):
            errors.append("SECRET_KEY must be a secure random value")
        if not self.MAIL_USERNAME:
            errors.append("MAIL_USERNAME is required for email verification")
        if not self.MAIL_PASSWORD:
            errors.append("MAIL_PASSWORD is required for email verification")
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