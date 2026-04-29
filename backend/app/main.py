"""
app/main.py
FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.db.mongo import connect_db, close_db
from app.api.auth import router as auth_router

load_dotenv()

# ── Lifespan: connect / disconnect DB ─────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


# ── App factory ────────────────────────────────────────────────────────────

app = FastAPI(
    title="CareerForge Arena API",
    description="Gamified coding & career development platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth_router)


# ── Health check ───────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "CareerForge Arena API"}