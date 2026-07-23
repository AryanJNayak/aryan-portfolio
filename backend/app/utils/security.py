"""
Security helpers: password hashing/verification and JWT creation/decoding.

Purpose:
    Centralize all cryptographic operations so routes/services stay clean.

Example:
    token = create_access_token({"sub": "admin@example.com"})
    data = decode_access_token(token)  # -> {"sub": "admin@example.com", "exp": ...}
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# bcrypt-based hashing context.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """
    Purpose: Hash a plaintext password for safe storage/comparison.
    Inputs:  plain (str) - the raw password.
    Output:  str - a bcrypt hash.
    """
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """
    Purpose: Check a plaintext password against a stored hash.
    Inputs:  plain (str), hashed (str).
    Output:  bool - True if they match.
    Example: verify_password("pw", hash_password("pw"))  # -> True
    """
    return _pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    """
    Purpose: Create a signed JWT access token.
    Inputs:
        data (dict)          - claims to embed (e.g. {"sub": email}).
        expires_minutes(int) - optional override for token lifetime.
    Output:
        str - encoded JWT.
    Example:
        create_access_token({"sub": "me@x.com"})
    """
    to_encode = data.copy()
    minutes = expires_minutes or settings.JWT_EXPIRE_MINUTES
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Purpose: Verify and decode a JWT.
    Inputs:  token (str) - the JWT to validate.
    Output:  dict of claims if valid, else None.
    Example: decode_access_token(token)  # -> {"sub": ..., "exp": ...}
    """
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
