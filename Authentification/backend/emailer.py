import os
import smtplib
from email.message import EmailMessage

MODE = os.getenv("MAIL_MODE", "console")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@example.com")
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8081")

def email_enabled() -> bool:
    return os.getenv("EMAIL_SERVICE_ENABLED", "0").lower() in {"1", "true", "yes", "on"}

def send_verification(email: str, token: str):
    if not email_enabled():
        print(f"[MAIL DISABLED] Skipping email to {email}. Token: {token}")
        return
    url = f"{PUBLIC_BASE_URL}/verify?token={token}"
    subject = "Verify your account"
    body = f"Click to verify: {url}"
    if MODE == "console":
        print(f"[MAIL] To: {email}\n{subject}\n{body}")
        return
    msg = EmailMessage()
    msg["From"] = MAIL_FROM
    msg["To"] = email
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
        s.starttls()
        if SMTP_USER:
            s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)