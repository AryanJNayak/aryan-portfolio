"""
Contact-form schemas.

Purpose:
    Validate messages submitted from the site's Contact section.
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactCreate(BaseModel):
    """
    Purpose: Body for POST /api/contact.
    Inputs:  name, email, message (subject optional).
    Example: {"name": "Recruiter", "email": "r@co.com", "message": "Hi!"}
    """

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    subject: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=1, max_length=4000)


class ContactResponse(ContactCreate):
    """Purpose: Stored contact message returned to the admin."""

    id: str
    created_at: datetime
