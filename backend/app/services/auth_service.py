"""
app/services/auth_service.py
Business logic for authentication:
  - password hashing / verification
  - JWT creation / decoding
  - user creation / lookup
"""

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status

from app.db.mongo import get_db
from app.models.user import UserInDB, UserPublic, user_doc_to_public

load_dotenv()

# ── Config ─────────────────────────────────────────────────────────────────
SECRET_KEY      = os.getenv("JWT_SECRET", "CHANGE_ME_in_production")
ALGORITHM       = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MINUTES  = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24 h

# ── Password hashing ───────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


# ── JWT ────────────────────────────────────────────────────────────────────

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """Return user_id (str) or raise 401."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
        return user_id
    except JWTError:
        raise credentials_exc


# ── DB operations ──────────────────────────────────────────────────────────

async def create_user(name: str, email: str, password: str) -> UserPublic:
    db = get_db()

    # Check for existing email
    existing = await db["users"].find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    doc = UserInDB(
        name=name,
        email=email,
        password_hash=hash_password(password),
    )
    result = await db["users"].insert_one(doc.model_dump())
    created = await db["users"].find_one({"_id": result.inserted_id})
    return user_doc_to_public(created)


async def authenticate_user(email: str, password: str) -> UserPublic:
    db = get_db()

    doc = await db["users"].find_one({"email": email})
    if not doc or not verify_password(password, doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    return user_doc_to_public(doc)


async def get_user_by_id(user_id: str) -> UserPublic:
    db = get_db()

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user ID.")

    doc = await db["users"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found.")
    return user_doc_to_public(doc)