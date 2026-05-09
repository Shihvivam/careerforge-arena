"""
app/core/email.py
Gmail SMTP email service — battle-tested with Python's built-in smtplib.

WHY smtplib instead of aiosmtplib:
  aiosmtplib's start_tls=True flag mishandles Gmail's STARTTLS handshake.
  smtplib.SMTP is rock-solid and we run it in a thread via asyncio.to_thread()
  so it never blocks the event loop.

GMAIL SETUP (required before this will work):
  1. Enable 2-Step Verification on your Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Select app: "Mail", device: "Other" → Generate
  4. Copy the 16-character App Password into MAIL_PASSWORD in your .env
  ⚠ NEVER use your real Gmail password — only App Passwords work with SMTP.

PORTS:
  587  → SMTP + STARTTLS  (default, recommended)
  465  → SMTP over SSL    (set MAIL_PORT=465 in .env)
"""

import asyncio
import logging
import secrets
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

log = logging.getLogger(__name__)

# ── Jinja2 template loader ─────────────────────────────────────────────────
_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _render_template(name: str, **ctx: object) -> str:
    return _jinja_env.get_template(name).render(**ctx)


# ── Token generation ───────────────────────────────────────────────────────

def generate_verification_token() -> str:
    """64-char cryptographically secure URL-safe token (384 bits of entropy)."""
    return secrets.token_urlsafe(48)


# ── SMTP core (runs in thread — never blocks event loop) ───────────────────

def _smtp_send_sync(*, to_email: str, subject: str, html_body: str) -> None:
    """
    Synchronous SMTP send — called via asyncio.to_thread().
    Handles both port 587 (STARTTLS) and port 465 (SSL) automatically.
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"]      = to_email
    msg["Reply-To"] = settings.MAIL_FROM
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    if settings.MAIL_PORT == 465:
        # ── SSL from the start (port 465) ──────────────────────────────────
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(settings.MAIL_SERVER, 465, context=context, timeout=30) as smtp:
            smtp.set_debuglevel(0)
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

    else:
        # ── STARTTLS (port 587) — connect plain, then upgrade ──────────────
        context = ssl.create_default_context()
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=30) as smtp:
            smtp.set_debuglevel(0)
            smtp.ehlo()
            smtp.starttls(context=context)   # upgrade to TLS
            smtp.ehlo()                       # re-identify after TLS
            smtp.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            smtp.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

    log.info(f"[Email] ✅ Sent '{subject}' → {to_email}")


async def _send_email(*, to_email: str, subject: str, html_body: str) -> None:
    """Async wrapper — runs sync SMTP in a thread pool."""
    await asyncio.to_thread(
        _smtp_send_sync,
        to_email=to_email,
        subject=subject,
        html_body=html_body,
    )


# ── Console fallback (development) ─────────────────────────────────────────

def _console_print_link(*, to_email: str, name: str, token: str) -> None:
    """
    Prints the verification link to the terminal.
    Useful in development when Gmail isn't configured.
    Disable by setting EMAIL_CONSOLE_FALLBACK=false in .env
    """
    url = f"{settings.FRONTEND_URL}/verify-email/{token}"
    sep = "─" * 60
    print(f"\n{'═' * 60}")
    print(f"  📧  EMAIL VERIFICATION LINK (dev console fallback)")
    print(f"{'═' * 60}")
    print(f"  To:    {to_email}  ({name})")
    print(f"  URL:   {url}")
    print(f"{'═' * 60}\n")


# ── Public API ─────────────────────────────────────────────────────────────

async def send_verification_email(*, to_email: str, name: str, token: str) -> None:
    """
    Build and send the HTML verification email.
    Raises on SMTP failure (caller decides whether to swallow).
    """
    expires_hours    = settings.EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS // 3600
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"

    html = _render_template(
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
    """
    Send verification email with full error visibility.

    Behaviour:
      - If SMTP credentials are configured → attempt real send
        ✅ Success: logs success
        ❌ Failure: logs the real error + falls back to console in dev
      - If SMTP not configured → console fallback only (dev convenience)
    """
    smtp_configured = bool(settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_FROM)

    if smtp_configured:
        try:
            await send_verification_email(to_email=to_email, name=name, token=token)
            return  # success — done
        except smtplib.SMTPAuthenticationError as exc:
            log.error(
                f"[Email] ❌ AUTHENTICATION FAILED for {settings.MAIL_USERNAME}.\n"
                f"  → Make sure you're using a Gmail App Password, NOT your real password.\n"
                f"  → Generate one at: https://myaccount.google.com/apppasswords\n"
                f"  → Raw error: {exc}"
            )
        except smtplib.SMTPException as exc:
            log.error(f"[Email] ❌ SMTP error sending to {to_email}: {exc}")
        except TimeoutError:
            log.error(f"[Email] ❌ SMTP connection timed out for {settings.MAIL_SERVER}:{settings.MAIL_PORT}")
        except Exception as exc:
            log.error(f"[Email] ❌ Unexpected error sending email to {to_email}: {type(exc).__name__}: {exc}")
    else:
        log.warning(
            "[Email] ⚠ SMTP not configured (MAIL_USERNAME/MAIL_PASSWORD/MAIL_FROM missing in .env). "
            "Falling back to console output."
        )

    # Console fallback — always shown in dev, also shown after SMTP failure in dev
    if settings.EMAIL_CONSOLE_FALLBACK:
        _console_print_link(to_email=to_email, name=name, token=token)


# ── Config diagnostics ─────────────────────────────────────────────────────

def get_email_config_status() -> dict:
    """Return a safe summary of the current email configuration (no secrets)."""
    return {
        "smtp_server":     settings.MAIL_SERVER,
        "smtp_port":       settings.MAIL_PORT,
        "tls_mode":        "SSL" if settings.MAIL_PORT == 465 else "STARTTLS",
        "username_set":    bool(settings.MAIL_USERNAME),
        "password_set":    bool(settings.MAIL_PASSWORD),
        "from_set":        bool(settings.MAIL_FROM),
        "from_name":       settings.MAIL_FROM_NAME,
        "console_fallback": settings.EMAIL_CONSOLE_FALLBACK,
        "frontend_url":    settings.FRONTEND_URL,
        "token_expire_h":  settings.EMAIL_VERIFY_TOKEN_EXPIRE_SECONDS // 3600,
        "fully_configured": bool(
            settings.MAIL_USERNAME and settings.MAIL_PASSWORD and settings.MAIL_FROM
        ),
    }