"""
app/models/user.py
Pydantic v2 schemas for user request/response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    name:     str      = Field(..., min_length=2, max_length=80,  strip_whitespace=True)
    email:    EmailStr
    password: str      = Field(..., min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def name_chars(cls, v: str) -> str:
        import re
        if not re.match(r"^[\w\s'\-\.]+$", v):
            raise ValueError("Name contains invalid characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if v.isalpha() or v.isdigit():
            raise ValueError("Password must contain both letters and numbers.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class MessageResponse(BaseModel):
    """Simple message response schema."""
    message: str

# Add this under your LoginRequest class
class ResendVerificationRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserPublic(BaseModel):
    id:         str
    name:       str
    email:      EmailStr
    xp:         int      = 0
    level:      int      = 1
    streak:     int      = 0
    created_at: datetime

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int
    user:         UserPublic


class MessageResponse(BaseModel):
    message: str


class UserInDB(BaseModel):
    name:               str
    email:              str
    password_hash:      str
    xp:                 int      = 0
    level:              int      = 1
    streak:             int      = 0
    last_activity_date: Optional[datetime] = None
    created_at:         datetime = Field(default_factory=datetime.utcnow)
    updated_at:         datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True

def doc_to_public(doc: dict) -> UserPublic:
    """Convert a raw MongoDB document to UserPublic."""
def user_doc_to_public(doc: dict) -> UserPublic:
return UserPublic(
        id         = str(doc["_id"]),
        name       = doc["name"],
        email      = doc["email"],
        xp         = doc.get("xp", 0),
        level      = doc.get("level", 1),
        streak     = doc.get("streak", 0),
        created_at = doc["created_at"],
    )