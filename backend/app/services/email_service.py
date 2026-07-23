"""
Email (SMTP) service.

Purpose:
    Send contact-form notifications to the portfolio owner via SMTP.

Inputs:
    Contact fields (name, email, subject, message) + SMTP settings from env.
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)


def smtp_configured() -> bool:
    """Purpose: True when the minimum SMTP env vars are present."""
    return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)


def _build_message(
    *,
    name: str,
    email: str,
    subject: str | None,
    message: str,
) -> EmailMessage:
    """Purpose: Build a plain-text + HTML email from contact-form fields."""
    topic = (subject or "").strip() or "New portfolio contact message"
    text_body = (
        f"You received a new message from your portfolio contact form.\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Subject: {topic}\n\n"
        f"Message:\n{message}\n"
    )
    html_body = f"""\
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

    msg = EmailMessage()
    msg["Subject"] = f"[Portfolio] {topic}"
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = settings.SMTP_TO or settings.ADMIN_EMAIL
    msg["Reply-To"] = email
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")
    return msg


def _send_sync(msg: EmailMessage) -> None:
    """Purpose: Deliver `msg` over SMTP (blocking)."""
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


async def send_contact_email(
    *,
    name: str,
    email: str,
    subject: str | None,
    message: str,
) -> None:
    """
    Purpose: Send the contact notification asynchronously (off the event loop).
    Raises:  RuntimeError if SMTP is not configured; smtplib errors on failure.
    """
    if not smtp_configured():
        raise RuntimeError(
            "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env"
        )

    msg = _build_message(name=name, email=email, subject=subject, message=message)
    await asyncio.to_thread(_send_sync, msg)
    logger.info("Contact email sent to %s", settings.SMTP_TO or settings.ADMIN_EMAIL)
