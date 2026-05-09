"""
test_email.py  —  Standalone Gmail SMTP diagnostic tool
Run this BEFORE starting the FastAPI server to confirm email works.

Usage:
    cd backend
    python test_email.py

It tests every step individually and tells you exactly what is broken.
"""

import os
import smtplib
import socket
import ssl
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ── Load .env manually (no FastAPI needed) ─────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅  Loaded .env file")
except ImportError:
    print("⚠   python-dotenv not installed — reading system env vars only")

# ── Read config ────────────────────────────────────────────────────────────
MAIL_USERNAME  = os.getenv("MAIL_USERNAME",  "").strip()
MAIL_PASSWORD  = os.getenv("MAIL_PASSWORD",  "").strip().replace(" ", "")  # strip spaces
MAIL_FROM      = os.getenv("MAIL_FROM",      MAIL_USERNAME).strip()
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "CareerForge Arena")
MAIL_SERVER    = os.getenv("MAIL_SERVER",    "smtp.gmail.com")
MAIL_PORT      = int(os.getenv("MAIL_PORT",  "587"))
FRONTEND_URL   = os.getenv("FRONTEND_URL",   "http://localhost:5173")

# ── Helpers ────────────────────────────────────────────────────────────────
SEP  = "─" * 60
PASS = "✅"
FAIL = "❌"
WARN = "⚠ "

def ok(msg):   print(f"  {PASS}  {msg}")
def fail(msg): print(f"  {FAIL}  {msg}"); sys.exit(1)
def warn(msg): print(f"  {WARN}  {msg}")
def step(n, title):
    print(f"\n{'═'*60}")
    print(f"  STEP {n}: {title}")
    print(f"{'═'*60}")


# ══════════════════════════════════════════════════════════════════
#  STEP 1 — Check .env values are present
# ══════════════════════════════════════════════════════════════════
step(1, "Check .env values")

print(f"  MAIL_USERNAME  = {MAIL_USERNAME  or '(empty)'}")
print(f"  MAIL_PASSWORD  = {'*' * len(MAIL_PASSWORD) if MAIL_PASSWORD else '(empty)'}")
print(f"  MAIL_FROM      = {MAIL_FROM      or '(empty)'}")
print(f"  MAIL_SERVER    = {MAIL_SERVER}")
print(f"  MAIL_PORT      = {MAIL_PORT}")

if not MAIL_USERNAME:
    fail("MAIL_USERNAME is empty. Add it to your .env file.")
if not MAIL_PASSWORD:
    fail("MAIL_PASSWORD is empty. Add your Gmail App Password to .env.")
if not MAIL_FROM:
    fail("MAIL_FROM is empty. Add it to your .env file.")

if len(MAIL_PASSWORD) not in (16, 19):
    warn(
        f"MAIL_PASSWORD has {len(MAIL_PASSWORD)} chars. "
        "A Gmail App Password should be exactly 16 characters (or 19 with spaces). "
        "Make sure you're using an App Password, NOT your real Gmail password."
    )
else:
    ok(f"Password length looks correct ({len(MAIL_PASSWORD)} chars)")

ok("All required .env values are present")


# ══════════════════════════════════════════════════════════════════
#  STEP 2 — DNS resolution
# ══════════════════════════════════════════════════════════════════
step(2, f"DNS resolution for {MAIL_SERVER}")

try:
    ip = socket.gethostbyname(MAIL_SERVER)
    ok(f"{MAIL_SERVER} resolved to {ip}")
except socket.gaierror as e:
    fail(f"Cannot resolve {MAIL_SERVER}: {e}\nCheck your internet connection.")


# ══════════════════════════════════════════════════════════════════
#  STEP 3 — TCP connection
# ══════════════════════════════════════════════════════════════════
step(3, f"TCP connection to {MAIL_SERVER}:{MAIL_PORT}")

try:
    sock = socket.create_connection((MAIL_SERVER, MAIL_PORT), timeout=10)
    sock.close()
    ok(f"TCP connection to port {MAIL_PORT} successful")
except (socket.timeout, ConnectionRefusedError, OSError) as e:
    fail(
        f"Cannot connect to {MAIL_SERVER}:{MAIL_PORT}: {e}\n"
        f"  • Your network or firewall may be blocking outbound port {MAIL_PORT}.\n"
        f"  • Try switching to port 465 by setting MAIL_PORT=465 in .env"
    )


# ══════════════════════════════════════════════════════════════════
#  STEP 4 — SMTP handshake + TLS negotiation
# ══════════════════════════════════════════════════════════════════
step(4, "SMTP handshake + TLS negotiation")

ctx = ssl.create_default_context()

try:
    if MAIL_PORT == 465:
        print(f"  Using: SMTP_SSL (port 465)")
        smtp = smtplib.SMTP_SSL(MAIL_SERVER, 465, context=ctx, timeout=15)
    else:
        print(f"  Using: SMTP + STARTTLS (port {MAIL_PORT})")
        smtp = smtplib.SMTP(MAIL_SERVER, MAIL_PORT, timeout=15)
        smtp.ehlo()
        smtp.starttls(context=ctx)
        smtp.ehlo()

    ok("TLS handshake successful")

except ssl.SSLError as e:
    fail(f"TLS/SSL error: {e}\nTry setting MAIL_PORT=465 in your .env")
except smtplib.SMTPException as e:
    fail(f"SMTP handshake failed: {e}")


# ══════════════════════════════════════════════════════════════════
#  STEP 5 — Gmail authentication
# ══════════════════════════════════════════════════════════════════
step(5, "Gmail authentication")

try:
    smtp.login(MAIL_USERNAME, MAIL_PASSWORD)
    ok(f"Logged in as {MAIL_USERNAME}")

except smtplib.SMTPAuthenticationError as e:
    smtp.quit()
    print(f"\n  {FAIL}  Authentication failed!")
    print(f"\n  Error code: {e.smtp_code}  —  {e.smtp_error.decode() if isinstance(e.smtp_error, bytes) else e.smtp_error}")
    print("""
  ┌─────────────────────────────────────────────────────┐
  │  HOW TO FIX: Gmail App Password                     │
  ├─────────────────────────────────────────────────────┤
  │  1. Go to: https://myaccount.google.com/security    │
  │  2. Enable "2-Step Verification" (must be ON)       │
  │  3. Go to: https://myaccount.google.com/apppasswords│
  │  4. Click "Select app" → choose "Other (custom)"    │
  │  5. Type "CareerForge" → click Generate             │
  │  6. Copy the 16-char password shown                 │
  │  7. Paste into .env as MAIL_PASSWORD                │
  │     (remove any spaces from the password)           │
  │                                                     │
  │  ⚠  Do NOT use your real Gmail password here.      │
  │  ⚠  Do NOT use 2FA codes — use App Passwords.      │
  └─────────────────────────────────────────────────────┘
    """)
    sys.exit(1)

except smtplib.SMTPException as e:
    smtp.quit()
    fail(f"Login failed: {e}")


# ══════════════════════════════════════════════════════════════════
#  STEP 6 — Send a real test email
# ══════════════════════════════════════════════════════════════════
step(6, "Send real test email")

TO_EMAIL = input(f"\n  Enter recipient email address (press Enter to send to {MAIL_USERNAME}): ").strip()
if not TO_EMAIL:
    TO_EMAIL = MAIL_USERNAME

print(f"\n  Sending test email to: {TO_EMAIL} ...")

test_token = "test_token_0000000000000000000000000000000000000000000000"
verify_url = f"{FRONTEND_URL}/verify-email/{test_token}"

html_body = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: -apple-system, Arial, sans-serif; background: #050a14; padding: 40px 20px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #0a1628; border: 1px solid rgba(34,211,238,0.2); border-radius: 16px; padding: 40px; }}
    .logo {{ font-size: 22px; font-weight: 900; color: #fff; margin-bottom: 24px; }}
    .logo span {{ color: #22d3ee; }}
    h1 {{ color: #fff; font-size: 22px; margin: 0 0 12px; }}
    p {{ color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }}
    .btn {{ display: inline-block; background: #22d3ee; color: #000; font-weight: 900; font-size: 13px;
            letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 32px;
            border-radius: 8px; text-decoration: none; }}
    .url-box {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
                border-radius: 8px; padding: 12px; margin-top: 24px; }}
    .url-box p {{ color: #4b5563; font-size: 11px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.1em; }}
    .url-box a {{ color: #22d3ee; font-size: 12px; word-break: break-all; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Career<span>Forge</span> Arena</div>
    <h1>✅ Email system is working!</h1>
    <p>
      This is a test email from your CareerForge Arena backend.<br>
      If you received this, your Gmail SMTP configuration is correct.
    </p>
    <a href="{verify_url}" class="btn">Sample Verify Button</a>
    <div class="url-box">
      <p>Sample verification URL:</p>
      <a href="{verify_url}">{verify_url}</a>
    </div>
  </div>
</body>
</html>
"""

msg = MIMEMultipart("alternative")
msg["Subject"] = "✅ CareerForge Arena — Email test successful"
msg["From"]    = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
msg["To"]      = TO_EMAIL
msg.attach(MIMEText(html_body, "html", "utf-8"))

try:
    smtp.sendmail(MAIL_FROM, TO_EMAIL, msg.as_string())
    smtp.quit()
    print(f"""
  {PASS}  Email sent successfully to {TO_EMAIL}!

  ┌─────────────────────────────────────────────────────┐
  │  ALL STEPS PASSED — Gmail SMTP is working ✅        │
  ├─────────────────────────────────────────────────────┤
  │  Check inbox (and spam folder) for the test email.  │
  │  Your .env is correctly configured.                 │
  │  You can now start the FastAPI server.              │
  └─────────────────────────────────────────────────────┘
    """)

except smtplib.SMTPRecipientsRefused as e:
    fail(f"Recipient refused: {e}\nCheck the TO address is valid.")
except smtplib.SMTPException as e:
    fail(f"Send failed: {e}")


# ══════════════════════════════════════════════════════════════════
#  SUMMARY
# ══════════════════════════════════════════════════════════════════
print(f"\n{'═'*60}")
print("  DIAGNOSIS COMPLETE")
print(f"{'═'*60}")
print(f"  Server  : {MAIL_SERVER}:{MAIL_PORT}")
print(f"  TLS mode: {'SSL' if MAIL_PORT == 465 else 'STARTTLS'}")
print(f"  Account : {MAIL_USERNAME}")
print(f"  Status  : All checks passed ✅")
print(f"{'═'*60}\n")