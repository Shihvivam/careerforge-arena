"""
app/api/auth.py  —  Authentication API routes
POST /auth/signup | POST /auth/login | GET /auth/me | POST /auth/logout
"""

from fastapi import APIRouter, Depends, status

from app.core.config import settings
from app.core.security import create_access_token
from app.middleware.auth_middleware import get_current_user
from app.models.user import (
    LoginRequest, MessageResponse, SignupRequest, TokenResponse, UserPublic,
)
from app.services.auth_service import authenticate_user, create_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED,
    summary="Register a new user")
async def signup(body: SignupRequest) -> UserPublic:
    """Hash password, store user, return public profile (no token — redirect to login)."""
    return await create_user(name=body.name, email=body.email, password=body.password)


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT")
async def login(body: LoginRequest) -> TokenResponse:
    """Authenticate with email+password, return signed JWT access token."""
    user  = await authenticate_user(body.email, body.password)
    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user,
    )


@router.get("/me", response_model=UserPublic, summary="Get authenticated user")
async def me(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    """Protected — validates Bearer JWT, returns current user. Used on every page load."""
    return current_user


@router.post("/logout", response_model=MessageResponse, summary="Logout acknowledgment")
async def logout(_: UserPublic = Depends(get_current_user)) -> MessageResponse:
    """Client removes token from localStorage. Future: add to Redis denylist."""
    return MessageResponse(message="Logged out successfully.")