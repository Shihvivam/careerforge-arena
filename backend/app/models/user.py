"""
app/models/user.py
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


# ── Request schemas ────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class MessageResponse(BaseModel):
    """Simple message response schema."""
    message: str

# Add this under your LoginRequest class
class ResendVerificationRequest(BaseModel):
    email: EmailStr

# ── Response / internal schemas ────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe user representation — never exposes password_hash."""
    id: str
    name: str
    email: EmailStr
    xp: int = 0
    level: int = 1
    streak: int = 0
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ── DB document helper ─────────────────────────────────────────────────────

class UserInDB(BaseModel):
    """Represents the document stored in MongoDB (includes password_hash)."""
    name: str
    email: str
    password_hash: str
    xp: int = 0
    level: int = 1
    streak: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


def doc_to_public(doc: dict) -> UserPublic:
    """Convert a raw MongoDB document to UserPublic."""
    return UserPublic(
        id=str(doc["_id"]),
        name=doc["name"],
        email=doc["email"],
        xp=doc.get("xp", 0),
        level=doc.get("level", 1),
        streak=doc.get("streak", 0),
        created_at=doc["created_at"],
    )