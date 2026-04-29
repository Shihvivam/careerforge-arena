"""
app/api/auth.py
FastAPI router: /auth/signup, /auth/login, /auth/me
"""

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.user import (
    SignupRequest,
    LoginRequest,
    TokenResponse,
    UserPublic,
)
from app.services.auth_service import (
    create_user,
    authenticate_user,
    get_user_by_id,
    create_access_token,
    decode_access_token,
)

router  = APIRouter(prefix="/auth", tags=["Auth"])
bearer  = HTTPBearer()


# ── Dependency: extract + validate Bearer token ────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> UserPublic:
    user_id = decode_access_token(credentials.credentials)
    return await get_user_by_id(user_id)


# ── Endpoints ──────────────────────────────────────────────────────────────

@router.post(
    "/signup",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def signup(body: SignupRequest):
    """
    Create a new CareerForge account.
    Returns the created user (no token — user must log in after signup).
    """
    return await create_user(
        name=body.name,
        email=body.email,
        password=body.password,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT",
)
async def login(body: LoginRequest):
    """
    Authenticate with email + password.
    Returns a JWT access token and the authenticated user.
    """
    user  = await authenticate_user(body.email, body.password)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=user)


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current authenticated user",
)
async def me(current_user: UserPublic = Depends(get_current_user)):
    """
    Protected route — requires a valid Bearer token.
    Returns the profile of the logged-in user.
    """
    return current_user