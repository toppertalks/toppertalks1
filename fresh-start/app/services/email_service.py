from __future__ import annotations

import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(*, to: str, subject: str, body: str, html: Optional[str] = None) -> None:
    """
    Send an email using the Resend API.
    """
    if not settings.RESEND_API_KEY:
        logger.warning(
            "\n--- DEV EMAIL ---\nTo: %s\nSubject: %s\n\n%s\n-----------------",
            to,
            subject,
            body,
        )
        return

    payload = {
        "from": settings.EMAIL_FROM,
        "to": [to],
        "subject": subject,
        "text": body,
    }
    if html:
        payload["html"] = html

    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(
            RESEND_API_URL,
            headers=headers,
            json=payload,
            timeout=15.0,
        )
        response.raise_for_status()
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
