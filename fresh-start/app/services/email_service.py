from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_via_smtp(message: EmailMessage) -> None:
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
        if settings.SMTP_USE_TLS:
            smtp.starttls()
        if settings.SMTP_USER:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(message)


def send_email(*, to: str, subject: str, body: str, html: Optional[str] = None) -> None:
    """
    Send an email. If SMTP_HOST is empty, the email is logged to stdout so you
    can grab verification / reset links during local development.
    """
    if not settings.SMTP_HOST:
        logger.warning(
            "\n--- DEV EMAIL ---\nTo: %s\nSubject: %s\n\n%s\n-----------------",
            to,
            subject,
            body,
        )
        return

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    if html:
        msg.add_alternative(html, subtype="html")

    try:
        _send_via_smtp(msg)
    except Exception:
        logger.exception("Failed to send email to %s", to)


# ---- Templated helpers ---------------------------------------------------

def send_verification_email(*, to: str, link: str, otp: str | None = None) -> None:
    if otp:
        body = (
            f"Welcome to ToppertTalks!\n\n"
            f"Your 6-digit verification code is:\n\n"
            f"    {otp}\n\n"
            f"The code expires in 10 minutes.\n\n"
            f"You can also click this link to verify automatically:\n{link}\n\n"
            f"If you didn't sign up, ignore this email."
        )
    else:
        body = (
            f"Welcome to ToppertTalks!\n\n"
            f"Please verify your email by opening this link:\n{link}\n\n"
            f"If you didn't sign up, ignore this email."
        )
    send_email(to=to, subject="Verify your ToppertTalks email", body=body)


def send_password_reset_email(*, to: str, link: str) -> None:
    send_email(
        to=to,
        subject="Reset your ToppertTalks password",
        body=(
            f"We received a request to reset your password.\n\n"
            f"Open this link to set a new password (valid for "
            f"{settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutes):\n{link}\n\n"
            f"If you didn't request this, you can ignore this email."
        ),
    )
