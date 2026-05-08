"""
app/api/auth.py  —  Authentication API routes (with email verification)

POST /auth/signup               Register → sends verification email
POST /auth/login                Login (blocked if unverified)
GET  /auth/me                   Get current user (protected)
POST /auth/logout               Logout acknowledgment
GET  /auth/verify-email/{token} Verify email via token from link
POST /auth/resend-verification  Resend verification email (rate-limited)
"""

from fastapi import APIRouter, Depends, status

from app.core.config import settings
from app.core.security import create_access_token
from app.middleware.auth_middleware import get_current_user
from app.models.user import (
    LoginRequest,
    MessageResponse,
    ResendVerificationRequest,
    SignupRequest,
    TokenResponse,
    UserPublic,
)
from app.services.auth_service import (
    authenticate_user,
    create_user,
    resend_verification_email,
    verify_email_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── POST /auth/signup ──────────────────────────────────────────────────────

@router.post("/signup", response_model=MessageResponse, status_code=status.HTTP_201_CREATED,
    summary="Register and send verification email")
async def signup(body: SignupRequest) -> MessageResponse:
    """
    Create account → hash password → send Gmail verification email.
    Returns a message (no token — user must verify before login).
    """
    await create_user(name=body.name, email=body.email, password=body.password)
    return MessageResponse(
        message=f"Account created! We've sent a verification email to {body.email}. "
                f"Please check your inbox and click the link to activate your account."
    )


# ── POST /auth/login ───────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse, summary="Login (verified users only)")
async def login(body: LoginRequest) -> TokenResponse:
    """
    Authenticate email+password.
    Returns 403 with code EMAIL_NOT_VERIFIED if email not yet verified.
    Returns JWT access token on success.
    """
    user  = await authenticate_user(body.email, body.password)
    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token = token,
        token_type   = "bearer",
        expires_in   = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user         = user,
    )


# ── GET /auth/me ───────────────────────────────────────────────────────────

@router.get("/me", response_model=UserPublic, summary="Get authenticated user")
async def me(current_user: UserPublic = Depends(get_current_user)) -> UserPublic:
    """Protected — validates Bearer JWT, returns current user profile."""
    return current_user


# ── POST /auth/logout ──────────────────────────────────────────────────────

@router.post("/logout", response_model=MessageResponse, summary="Logout acknowledgment")
async def logout(_: UserPublic = Depends(get_current_user)) -> MessageResponse:
    """Client removes token from localStorage. Future: add to Redis denylist."""
    return MessageResponse(message="Logged out successfully.")


# ── GET /auth/verify-email/{token} ────────────────────────────────────────

@router.get("/verify-email/{token}", response_model=MessageResponse,
    summary="Verify email address via token")
async def verify_email(token: str) -> MessageResponse:
    """
    Called when the user clicks the link in their verification email.
    - Validates the token
    - Marks user as verified
    - Clears the verification token
    Returns 400 if token is invalid or expired.
    """
    user = await verify_email_token(token)
    return MessageResponse(
        message=f"✅ Email verified successfully! Welcome to CareerForge Arena, {user.name}."
    )


# ── POST /auth/resend-verification ────────────────────────────────────────

@router.post("/resend-verification", response_model=MessageResponse,
    summary="Resend verification email (rate-limited)")
async def resend_verification(body: ResendVerificationRequest) -> MessageResponse:
    """
    Generates a new token and resends the verification email.
    Rate-limited to one request per 2 minutes per email.
    Returns 429 if called too soon.
    """
    await resend_verification_email(body.email)
    return MessageResponse(
        message="If that email is registered and unverified, "
                "a new verification link has been sent. Please check your inbox."
    )
