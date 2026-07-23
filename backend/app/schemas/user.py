"""
Auth-related schemas.

Purpose:
    Validate the login request body and shape the token response.
"""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """
    Purpose: Body for POST /api/auth/login.
    Inputs:  email (EmailStr), password (str).
    Example: {"email": "me@x.com", "password": "secret"}
    """

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """
    Purpose: Response for a successful login.
    Output:  access_token (str) + token_type ("bearer").
    Example: {"access_token": "eyJ...", "token_type": "bearer"}
    """

    access_token: str
    token_type: str = "bearer"
