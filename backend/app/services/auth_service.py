"""
Authentication service.

Purpose:
    Validate the single admin's credentials against the values in `.env` and
    issue a JWT. There is only one admin (you), so no user collection is needed.

Example:
    token = authenticate_admin("me@x.com", "pw")  # -> "eyJ..." or None
"""

import secrets

from app.config import settings
from app.utils.security import create_access_token


def authenticate_admin(email: str, password: str) -> str | None:
    """
    Purpose: Check submitted credentials and mint an access token if valid.
    Inputs:  email (str), password (str) from the login form.
    Output:  A JWT string if credentials match, otherwise None.
    Example: authenticate_admin("me@x.com", "pw")
    """
    # `compare_digest` avoids timing attacks on the comparison.
    email_ok = secrets.compare_digest(email.lower(), settings.ADMIN_EMAIL.lower())
    password_ok = secrets.compare_digest(password, settings.ADMIN_PASSWORD)

    if email_ok and password_ok:
        return create_access_token({"sub": settings.ADMIN_EMAIL})
    return None
