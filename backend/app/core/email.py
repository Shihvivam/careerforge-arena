"""
app/core/email.py
Async Gmail SMTP email service using aiosmtplib + Jinja2 templates.

SETUP:
  1. Enable 2-Step Verification on your Google account
  2. Go to: https://myaccount.google.com/apppasswords
  3. Generate an App Password → set as MAIL_PASSWORD in .env
  NEVER use your real Gmail password.
"""

import logging
import secrets
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

log = logging.getLogger(__name__)

# ── Jinja2 template loader ─────────────────────────────────────────────────
_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
_jinja_env    = Environment(
    loader    = FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape= select_autoescape(["html"]),
)


def _render(template_name: str, **ctx) -> str:
    return _jinja_env.get_template(template_name).render(**ctx)


# ── Token generation ───────────────────────────────────────────────────────

def generate_verification_token() -> str:
    """Cryptographically secure 64-char URL-safe token."""
    return secrets.token_urlsafe(48)


# ── Core SMTP send ─────────────────────────────────────────────────────────

async def _send_email(*, to_email: str, subject: str, html_body: str) -> None:
    """Send HTML email via Gmail STARTTLS."""
    msg              = MIMEMultipart("alternative")
    msg["Subject"]   = subject
    msg["From"]      = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"]        = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    async with aiosmtplib.SMTP(
        hostname  = settings.MAIL_SERVER,
        port      = settings.MAIL_PORT,
        start_tls = True,
        timeout   = 20,
    ) as smtp:
        await smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        await smtp.send_message(msg)
        log.info(f"[Email] Sent '{subject}' → {to_email}")


# ── Public senders ─────────────────────────────────────────────────────────

async def send_verification_email(*, to_email: str, name: str, token: str) -> None:
    expires_hours    = settings.EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS // 3600
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"

    html = _render(
        "verify_email.html",
        name             = name,
        email            = to_email,
        verification_url = verification_url,
        expires_hours    = expires_hours,
        frontend_url     = settings.FRONTEND_URL,
    )
    await _send_email(
        to_email  = to_email,
        subject   = "✉️ Verify your CareerForge Arena email",
        html_body = html,
    )


async def try_send_verification_email(*, to_email: str, name: str, token: str) -> None:
    """Fire-and-forget — logs on failure, never crashes the request."""
    try:
        await send_verification_email(to_email=to_email, name=name, token=token)
    except Exception as exc:
        log.error(f"[Email] Failed to send to {to_email}: {exc}")