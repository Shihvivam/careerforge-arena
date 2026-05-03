"""
app/db/mongo.py
Async MongoDB connection using Motor with automatic credential encoding.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

# ── Build connection string safely ────────────────────────────────────────
_username   = os.getenv("MONGO_USERNAME")
_password   = os.getenv("MONGO_PASSWORD")
_cluster    = os.getenv("MONGO_CLUSTER")
_app_name   = os.getenv("MONGO_APP_NAME", "CareerForge-Arena-Cluster")
_db_name    = os.getenv("MONGO_DB_NAME", "careerforge")

# Automatically encode username and password to handle special characters like '@'
if _username and _password:
    _user_encoded = urllib.parse.quote_plus(_username)
    _pass_encoded = urllib.parse.quote_plus(_password)
    
    MONGO_URI = (
        f"mongodb+srv://{_user_encoded}:{_pass_encoded}@{_cluster}/"
        f"?retryWrites=true&w=majority&appName={_app_name}"
    )
else:
    # Fallback to a dummy string to avoid "none" errors during initialization
    MONGO_URI = "mongodb://localhost:27017"

# ── Module-level singletons ────────────────────────────────────────────────
client: AsyncIOMotorClient | None = None
db = None

def get_db():
    if db is None:
        raise RuntimeError("Database not initialised — call connect_db() first.")
    return db

async def connect_db():
    global client, db
    
    if not all([_username, _password, _cluster]):
        print("[ERROR] MongoDB environment variables are missing!")
        return

    client = AsyncIOMotorClient(MONGO_URI)
    db = client[_db_name]

    try:
        # Verify connection and ensure index
        await db["users"].create_index([("email", ASCENDING)], unique=True)
        print(f"[DB] Connected to MongoDB — database: '{_db_name}'")
    except Exception as e:
        print(f"[DB] Connection failed: {e}")

async def close_db():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed.")