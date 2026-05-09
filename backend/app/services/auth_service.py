"""
app/services/auth_service.py
Auth business logic — extended with email verification.
All DB access happens here. API layer delegates to these functions.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.config import settings
from app.core.security import hash_password, verify_password, needs_rehash
from app.core.email import generate_verification_token, try_send_verification_email
from app.db.mongo import get_db
from app.models.user import UserInDB, UserPublic, doc_to_public


# ── Exceptions ─────────────────────────────────────────────────────────────

def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail      = detail,
        headers     = {"WWW-Authenticate": "Bearer"},
    )

def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

def _conflict(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)

def _not_found(detail: str = "User not found.") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

def _too_many(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


# ── Level helper ────────────────────────────────────────────────────────────

def _level_for_xp(xp: int) -> int:
    level = 1
    while True:
        cost = level * 1000 + (level - 1) * 500
        if xp < cost:
            break
        xp   -= cost
        level += 1
    return level


# ── Signup ──────────────────────────────────────────────────────────────────

async def create_user(name: str, email: str, password: str) -> UserPublic:
    """
    Register new user with is_verified=False.
    Generates verification token and fires verification email.
    """
    db    = get_db()
    token = generate_verification_token()
    exp   = datetime.utcnow() + timedelta(seconds=settings.EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS)

    user_doc = UserInDB(
        name                   = name.strip(),
        email                  = email.strip().lower(),
        password_hash          = hash_password(password),
        is_verified            = False,
        verification_token     = token,
        verification_token_exp = exp,
    )

    try:
        result  = await db["users"].insert_one(user_doc.model_dump())
        created = await db["users"].find_one({"_id": result.inserted_id})
    except DuplicateKeyError:
        raise _conflict("An account with this email address already exists.")

    # Fire-and-forget — never block signup if email fails
    await try_send_verification_email(
        to_email = created["email"],
        name     = created["name"],
        token    = token,
    )

    return doc_to_public(created)


# ── Login (blocks unverified) ───────────────────────────────────────────────

async def authenticate_user(email: str, password: str) -> UserPublic:
    """
    Authenticate user.
    Raises 401 if credentials wrong.
    Raises 403 if email not verified.
    Timing-safe: always runs bcrypt even for missing users.
    """
    db  = get_db()
    doc = await db["users"].find_one({"email": email.strip().lower()})

    dummy       = "$2b$12$dummyhashtopreventtimingattackpadding0000000000000"
    stored_hash = doc["password_hash"] if doc else dummy
    password_ok = verify_password(password, stored_hash)

    if not doc or not password_ok:
        raise _unauthorized("Incorrect email or password.")

    # ── Block unverified users ──────────────────────────────────────────
    if not doc.get("is_verified", False):
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail      = "EMAIL_NOT_VERIFIED",   # machine-readable code for frontend
        )

    # Silent hash upgrade
    if needs_rehash(stored_hash):
        await db["users"].update_one(
            {"_id": doc["_id"]},
            {"$set": {"password_hash": hash_password(password), "updated_at": datetime.utcnow()}},
        )

    return doc_to_public(doc)


# ── Email verification ──────────────────────────────────────────────────────

async def verify_email_token(token: str) -> UserPublic:
    """
    Validate token, mark user as verified, clear token fields.
    Raises 400 on invalid/expired token.
    """
    db  = get_db()
    doc = await db["users"].find_one({"verification_token": token})

    if not doc:
        raise _bad_request("Verification link is invalid or has already been used.")

    # Check expiry
    exp = doc.get("verification_token_exp")
    if exp and exp < datetime.utcnow():
        raise _bad_request("Verification link has expired. Please request a new one.")

    if doc.get("is_verified"):
        # Idempotent — already verified
        return doc_to_public(doc)

    await db["users"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "is_verified":            True,
                "updated_at":             datetime.utcnow(),
            },
            "$unset": {
                "verification_token":     "",
                "verification_token_exp": "",
            },
        },
    )

    updated = await db["users"].find_one({"_id": doc["_id"]})
    return doc_to_public(updated)


# ── Resend verification ────────────────────────────────────────────────────

# Resend cooldown in seconds (2 minutes)
_RESEND_COOLDOWN_SECONDS = 120


async def resend_verification_email(email: str) -> dict:
    """
    Generate a new token and resend verification email.
    Rate-limited: one resend per 2 minutes.
    Returns {"sent": True, "cooldown_seconds": int}.
    """
    db  = get_db()
    doc = await db["users"].find_one({"email": email.strip().lower()})

    # Generic response — don't reveal whether email is registered
    generic_ok = {"sent": True, "cooldown_seconds": _RESEND_COOLDOWN_SECONDS}

    if not doc:
        return generic_ok   # silent — don't leak existence

    if doc.get("is_verified"):
        raise _bad_request("This email is already verified.")

    # Rate-limit check
    cooldown_until = doc.get("resend_cooldown_until")
    if cooldown_until and cooldown_until > datetime.utcnow():
        remaining = int((cooldown_until - datetime.utcnow()).total_seconds())
        raise _too_many(
            f"Please wait {remaining} seconds before requesting another verification email."
        )

    # Generate new token
    new_token = generate_verification_token()
    new_exp   = datetime.utcnow() + timedelta(seconds=settings.EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS)
    cooldown  = datetime.utcnow() + timedelta(seconds=_RESEND_COOLDOWN_SECONDS)

    await db["users"].update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "verification_token":     new_token,
            "verification_token_exp": new_exp,
            "resend_cooldown_until":  cooldown,
            "updated_at":             datetime.utcnow(),
        }},
    )

    await try_send_verification_email(
        to_email = doc["email"],
        name     = doc["name"],
        token    = new_token,
    )

    return generic_ok


# ── User lookup (used by auth middleware) ──────────────────────────────────

async def get_user_by_id(user_id: str) -> UserPublic:
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except (InvalidId, Exception):
        raise _unauthorized("Invalid user identifier in token.")

    doc = await db["users"].find_one({"_id": oid})
    if not doc:
        raise _unauthorized("User account no longer exists.")
    return doc_to_public(doc)