"""
app/main.py  —  FastAPI entry point with proper logging configured

Run:
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.email import get_email_config_status
from app.db.mongo import connect_db, close_db
from app.api.auth import router as auth_router

# ── Logging setup ──────────────────────────────────────────────────────────
# Ensures [Email] log lines are always visible in the terminal
logging.basicConfig(
    level   = logging.INFO,
    format  = "%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt = "%H:%M:%S",
    stream  = sys.stdout,
)
log = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()

    # Print email config status on startup so you know immediately if it's wrong
    cfg = get_email_config_status()
    if cfg["fully_configured"]:
        log.info(
            f"[Email] ✅ SMTP configured — {cfg['smtp_server']}:{cfg['smtp_port']} "
            f"({cfg['tls_mode']}) as {settings.MAIL_USERNAME}"
        )
    else:
        log.warning(
            "[Email] ⚠  SMTP NOT configured. "
            "Verification links will print to the console instead of being emailed. "
            "Set MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM in your .env to enable Gmail."
        )

    yield
    await close_db()


# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title       = settings.APP_NAME,
    version     = settings.APP_VERSION,
    description = "CareerForge Arena — gamified career development platform.",
    lifespan    = lifespan,
    docs_url    = "/docs"  if settings.DEBUG else None,
    redoc_url   = "/redoc" if settings.DEBUG else None,
)

# ── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.FRONTEND_ORIGIN],
    allow_credentials = True,
    allow_methods     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers     = ["*"],
)

# ── Global exception handler ───────────────────────────────────────────────
@app.exception_handler(Exception)
async def _global_handler(request: Request, exc: Exception):
    import traceback
    log.error(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})

# ── Routers ────────────────────────────────────────────────────────────────
app.include_router(auth_router)

# ── Health ─────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"], include_in_schema=False)
async def health():
    return {"status": "ok", "env": settings.APP_ENV, "version": settings.APP_VERSION}