"""
app/db/mongo.py
Async MongoDB connection using Motor.
Call connect_db() on startup and close_db() on shutdown.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

# ── Build connection string from env vars ──────────────────────────────────
_username   = os.getenv("MONGO_USERNAME")
_password   = os.getenv("MONGO_PASSWORD")
_cluster    = os.getenv("MONGO_CLUSTER")
_app_name   = os.getenv("MONGO_APP_NAME", "CareerForge-Arena-Cluster")
_db_name    = os.getenv("MONGO_DB_NAME", "careerforge")

MONGO_URI = (
    f"mongodb+srv://{_username}:{_password}@{_cluster}/"
    f"?retryWrites=true&w=majority&appName={_app_name}"
)

# ── Module-level singletons ────────────────────────────────────────────────
client: AsyncIOMotorClient | None = None
db = None


def get_db():
    """Return the active database handle."""
    if db is None:
        raise RuntimeError("Database not initialised — call connect_db() first.")
    return db


async def connect_db():
    """Open the MongoDB connection and ensure indexes exist."""
    global client, db

    client = AsyncIOMotorClient(MONGO_URI)
    db = client[_db_name]

    # Unique index on email so duplicate registrations are caught at DB level
    await db["users"].create_index([("email", ASCENDING)], unique=True)

    print(f"[DB] Connected to MongoDB — database: '{_db_name}'")


async def close_db():
    """Gracefully close the MongoDB connection."""
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed.")