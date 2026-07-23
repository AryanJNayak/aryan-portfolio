"""
Email service.

Purpose:
    Send contact-form notifications to the portfolio owner.

    Prefer Resend (HTTP API) on hosts like Render that block outbound SMTP.
    Fall back to SMTP when Resend is not configured (local / unrestricted hosts).
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def smtp_configured() -> bool:
    """Purpose: True when the minimum SMTP env vars are present."""
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def resend_configured() -> bool:
    """Purpose: True when Resend API key is set (works on Render free)."""
    return bool(settings.RESEND_API_KEY)


def email_configured() -> bool:
    """Purpose: True when any email delivery backend is configured."""
    return resend_configured() or smtp_configured()


def _notify_to() -> str:
    return settings.SMTP_TO or settings.ADMIN_EMAIL


def _topic(subject: str | None) -> str:
    return (subject or "").strip() or "New portfolio contact message"


def _text_body(*, name: str, email: str, topic: str, message: str) -> str:
    return (
        f"You received a new message from your portfolio contact form.\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Subject: {topic}\n\n"
        f"Message:\n{message}\n"
    )


def _html_body(*, name: str, email: str, topic: str, message: str) -> str:
    return f"""\
<html>
  <body style="font-family: sans-serif; line-height: 1.5; color: #0f172a;">
    <h2 style="margin-bottom: 0.5rem;">New portfolio contact message</h2>
    <p><strong>Name:</strong> {name}</p>
    <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
    <p><strong>Subject:</strong> {topic}</p>
    <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 1rem 0;" />
    <p style="white-space: pre-wrap;">{message}</p>
  </body>
</html>
"""


def _build_message(
    *,
    name: str,
    email: str,
    subject: str | None,
    message: str,
) -> EmailMessage:
    """Purpose: Build a plain-text + HTML email from contact-form fields (SMTP)."""
    topic = _topic(subject)
    msg = EmailMessage()
    msg["Subject"] = f"[Portfolio] {topic}"
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = _notify_to()
    msg["Reply-To"] = email
    msg.set_content(_text_body(name=name, email=email, topic=topic, message=message))
    msg.add_alternative(
        _html_body(name=name, email=email, topic=topic, message=message),
        subtype="html",
    )
    return msg


def _send_sync(msg: EmailMessage) -> None:
    """Purpose: Deliver `msg` over SMTP (blocking). Often blocked on Render free."""
    host = settings.SMTP_HOST
    port = settings.SMTP_PORT
    user = settings.SMTP_USER
    password = settings.SMTP_PASSWORD
    use_tls = settings.SMTP_USE_TLS
    use_ssl = settings.SMTP_USE_SSL

    if use_ssl:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(host, port, context=context, timeout=30) as server:
            server.login(user, password)
            server.send_message(msg)
        return

    with smtplib.SMTP(host, port, timeout=30) as server:
        server.ehlo()
        if use_tls:
            context = ssl.create_default_context()
            server.starttls(context=context)
            server.ehlo()
        server.login(user, password)
        server.send_message(msg)


async def _send_via_resend(
    *,
    name: str,
    email: str,
    subject: str | None,
    message: str,
) -> None:
    """Purpose: Send via Resend HTTPS API (works on Render free tier)."""
    topic = _topic(subject)
    payload = {
        "from": settings.RESEND_FROM,
        "to": [_notify_to()],
        "reply_to": email,
        "subject": f"[Portfolio] {topic}",
        "text": _text_body(name=name, email=email, topic=topic, message=message),
        "html": _html_body(name=name, email=email, topic=topic, message=message),
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if resp.status_code >= 400:
            detail = resp.text
            raise RuntimeError(f"Resend API error {resp.status_code}: {detail}")


async def send_contact_email(
    *,
    name: str,
    email: str,
    subject: str | None,
    message: str,
) -> None:
    """
    Purpose: Send the contact notification (Resend preferred, else SMTP).
    Raises:  RuntimeError if nothing is configured; provider errors on failure.
    """
    if not email_configured():
        raise RuntimeError(
            "Email is not configured. Set RESEND_API_KEY (recommended on Render) "
            "or SMTP_HOST / SMTP_USER / SMTP_PASSWORD."
        )

    if resend_configured():
        await _send_via_resend(name=name, email=email, subject=subject, message=message)
        logger.info("Contact email sent via Resend to %s", _notify_to())
        return

    msg = _build_message(name=name, email=email, subject=subject, message=message)
    await asyncio.to_thread(_send_sync, msg)
    logger.info("Contact email sent via SMTP to %s", _notify_to())
