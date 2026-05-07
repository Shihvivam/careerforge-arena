"""
app/db/mongo.py
Async MongoDB connection via Motor.
One client, one database — module-level singletons injected at startup.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.core.config import settings

_client: AsyncIOMotorClient | None = None
_db:     AsyncIOMotorDatabase | None = None


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError(
            "Database not initialised. "
            "Ensure connect_db() was called in the application lifespan."
        )
    return _db


async def connect_db() -> None:
    global _client, _db

    _client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        serverSelectionTimeoutMS=5_000,
        connectTimeoutMS=10_000,
        maxPoolSize=50,
        minPoolSize=5,
    )
    _db = _client[settings.MONGO_DB_NAME]

    await _client.admin.command("ping")
    print(f"[DB] Connected to MongoDB — database: '{settings.MONGO_DB_NAME}'")

    await _db["users"].create_index([("email", ASCENDING)], unique=True, name="unique_email")
    await _db["challenges"].create_index([("slug", ASCENDING)], unique=True, name="unique_slug")
    await _db["challenges"].create_index([("difficulty", ASCENDING)])
    await _db["challenges"].create_index([("category",   ASCENDING)])
    await _db["submissions"].create_index([("user_id",      ASCENDING)])
    await _db["submissions"].create_index([("challenge_id", ASCENDING)])
    print("[DB] Indexes verified.")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
        print("[DB] MongoDB connection closed.")