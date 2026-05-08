"""
app/core/security.py
All cryptographic operations:
  - bcrypt password hashing & verification
  - JWT access token creation & decoding
  - Token payload models
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# ── Password hashing ───────────────────────────────────────────────────────
# CryptContext handles algorithm upgrades transparently.
# Using bcrypt with configurable work factor (default 12).

_pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS,
)


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of the plain password. Never store the plain value."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Constant-time comparison of plain vs hashed password.
    Returns True only if they match.
    """
    return _pwd_context.verify(plain_password, hashed_password)


def needs_rehash(hashed_password: str) -> bool:
    """
    Returns True if the stored hash was created with outdated settings
    (e.g., lower bcrypt rounds). Use this to silently upgrade hashes on login.
    """
    return _pwd_context.needs_update(hashed_password)


# ── JWT tokens ────────────────────────────────────────────────────────────

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    subject: str,                        # user_id as string
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    """
    Create a signed JWT access token.
    `subject` is stored in the `sub` claim (industry standard).
    Optional `extra_claims` can carry non-sensitive supplementary data.
    """
    expire = _utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict = {
        "sub": subject,
        "iat": _utcnow(),
        "exp": expire,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    Raises JWTError (caught upstream) on any failure:
      - Expired signature
      - Invalid signature
      - Malformed token
      - Wrong token type
    """
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    if payload.get("type") != "access":
        raise JWTError("Token type mismatch — expected 'access'.")
    return payload


def extract_user_id(token: str) -> str:
    """
    Convenience wrapper: decode token and return the user_id (sub claim).
    Raises JWTError on any failure.
    """
    payload = decode_access_token(token)
    sub = payload.get("sub")
    if not sub:
        raise JWTError("Token missing 'sub' claim.")
    return sub
