"""
app/api/auth.py  —  Authentication routes + email verification endpoints

POST /auth/signup                  Register → sends Gmail verification email
POST /auth/login                   Login (blocked until email verified)
GET  /auth/me                      Get current user (JWT protected)
POST /auth/logout                  Logout
GET  /auth/verify-email/{token}    Verify email via token from link
POST /auth/resend-verification     Resend verification email (rate-limited)
GET  /auth/email-config            Dev-only — show SMTP config status
POST /auth/test-email              Dev-only — send a test email
"""

import smtplib

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.core.config import settings
from app.core.email import get_email_config_status, send_verification_email
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
    Create account → hash password with bcrypt → send Gmail verification email.
    User cannot log in until they click the verification link.
    """
    await create_user(name=body.name, email=body.email, password=body.password)
    return MessageResponse(
        message=(
            f"Account created! A verification email has been sent to {body.email}. "
            f"Please check your inbox (and spam folder) and click the link to activate your account."
        )
    )


# ── POST /auth/login ───────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse,
    summary="Login — verified users only")
async def login(body: LoginRequest) -> TokenResponse:
    """
    Returns 403 with detail='EMAIL_NOT_VERIFIED' if the user hasn't verified their email.
    Frontend uses this code to show the inline resend banner.
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
    return current_user


# ── POST /auth/logout ──────────────────────────────────────────────────────

@router.post("/logout", response_model=MessageResponse, summary="Logout")
async def logout(_: UserPublic = Depends(get_current_user)) -> MessageResponse:
    return MessageResponse(message="Logged out successfully.")


# ── GET /auth/verify-email/{token} ────────────────────────────────────────

@router.get("/verify-email/{token}", response_model=MessageResponse,
    summary="Verify email address via token link")
async def verify_email(token: str) -> MessageResponse:
    """
    Called when user clicks the link in their Gmail.
    Marks the account as verified and clears the token (one-time use).
    """
    user = await verify_email_token(token)
    return MessageResponse(
        message=f"Email verified successfully! Welcome to CareerForge Arena, {user.name}."
    )


# ── POST /auth/resend-verification ────────────────────────────────────────

@router.post("/resend-verification", response_model=MessageResponse,
    summary="Resend verification email (rate-limited to 1 per 2 minutes)")
async def resend_verification(body: ResendVerificationRequest) -> MessageResponse:
    await resend_verification_email(body.email)
    return MessageResponse(
        message=(
            "If that email address is registered and unverified, "
            "a new verification link has been sent. Please check your inbox."
        )
    )


# ── GET /auth/email-config  (dev only) ────────────────────────────────────

@router.get("/email-config", summary="[DEV] Show SMTP configuration status",
    include_in_schema=settings.DEBUG)
async def email_config():
    """
    Returns current SMTP config (no secrets exposed).
    Useful for diagnosing why emails aren't sending.
    Only available in development (APP_ENV=development).
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404)
    return get_email_config_status()


# ── POST /auth/test-email  (dev only) ─────────────────────────────────────

class TestEmailRequest(BaseModel):
    to_email: EmailStr

@router.post("/test-email", response_model=MessageResponse,
    summary="[DEV] Send a real test verification email",
    include_in_schema=settings.DEBUG)
async def test_email(body: TestEmailRequest):
    """
    Sends a real verification email to the given address.
    Use this to confirm your Gmail App Password is working.
    Only available in development (APP_ENV=development).
    """
    if not settings.DEBUG:
        raise HTTPException(status_code=404)

    cfg = get_email_config_status()
    if not cfg["fully_configured"]:
        raise HTTPException(
            status_code=400,
            detail=(
                "SMTP not fully configured. "
                f"Status: {cfg}. "
                "Set MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM in your .env file."
            ),
        )

    test_token = "test-token-not-real-000000000000000000000000000000000000000"
    try:
        await send_verification_email(
            to_email = str(body.to_email),
            name     = "Test User",
            token    = test_token,
        )
        return MessageResponse(
            message=f"Test email sent successfully to {body.to_email}. Check your inbox!"
        )
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=400,
            detail=(
                "Gmail authentication failed. "
                "Make sure MAIL_PASSWORD is a Gmail App Password, NOT your real Gmail password. "
                "Generate one at: https://myaccount.google.com/apppasswords"
            ),
        )
    except smtplib.SMTPException as exc:
        raise HTTPException(status_code=500, detail=f"SMTP error: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {type(exc).__name__}: {exc}")