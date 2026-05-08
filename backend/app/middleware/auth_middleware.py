"""
app/middleware/auth_middleware.py
FastAPI dependencies for JWT authentication.

Usage in route handlers:
    from app.middleware.auth_middleware import get_current_user

    @router.get("/protected")
    async def protected(user: UserPublic = Depends(get_current_user)):
        return user
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.security import extract_user_id
from app.models.user import UserPublic
from app.services.auth_service import get_user_by_id


# HTTPBearer auto-extracts the Bearer token from the Authorization header.
# auto_error=False means we can return a custom 401 instead of 403.
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> UserPublic:
    """
    FastAPI dependency that:
      1. Extracts the Bearer token from the Authorization header
      2. Decodes and validates the JWT
      3. Looks up the user in MongoDB
      4. Returns UserPublic or raises 401

    Inject with: user: UserPublic = Depends(get_current_user)
    """
    credentials_error = HTTPException(
        status_code  = status.HTTP_401_UNAUTHORIZED,
        detail       = "Authentication required. Please log in.",
        headers      = {"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_error

    try:
        user_id = extract_user_id(credentials.credentials)
    except JWTError as exc:
        # Map specific JWT errors to helpful messages
        detail = "Session expired. Please log in again." if "expired" in str(exc).lower() else "Invalid token. Please log in again."
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail      = detail,
            headers     = {"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(user_id)
    return user


# Optional dependency: same as above but returns None instead of raising
async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> UserPublic | None:
    """
    Like get_current_user but doesn't raise — returns None for unauthenticated requests.
    Useful for routes that behave differently for logged-in vs. anonymous users.
    """
    if credentials is None:
        return None
    try:
        user_id = extract_user_id(credentials.credentials)
        return await get_user_by_id(user_id)
    except Exception:
        return None
