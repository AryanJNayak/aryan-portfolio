"""
Contact routes.

Base path: /api/contact
Purpose:   Accept messages from the site's Contact form (saved to MongoDB),
           email them to the owner via SMTP, and let the admin read them.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import get_contacts_collection
from app.middlewares.auth_middleware import require_admin
from app.schemas.contact import ContactCreate
from app.services.email_service import email_configured, send_contact_email
from app.utils.logger import log, logged

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", status_code=201)
@logged("Contact", "/POST Contact")
async def create_contact(body: ContactCreate) -> dict:
    """
    Route:   POST /api/contact
    Purpose: Store a visitor's message and email it to the portfolio owner.
    Inputs:  JSON body {name, email, subject?, message}.
    Output:  {success: true, id, emailed: bool} of the stored message.
    Example: POST /api/contact {"name":"HR","email":"a@b.c","message":"Hi"}
    """
    doc = body.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await get_contacts_collection().insert_one(doc)

    emailed = False
    if email_configured():
        try:
            await send_contact_email(
                name=body.name,
                email=str(body.email),
                subject=body.subject,
                message=body.message,
            )
            emailed = True
            log("Contact", "send_contact_email", "OK")
        except Exception as exc:
            # Message is already saved — don't fail the visitor's submit.
            log("Contact", "send_contact_email", f"ERROR: {exc}")
    else:
        log("Contact", "/POST Contact", "Email not configured — saved without emailing")

    return {"success": True, "id": str(result.inserted_id), "emailed": emailed}


@router.get("", dependencies=[Depends(require_admin)])
@logged("Contact", "/GET Contacts")
async def list_contacts() -> list[dict]:
    """
    Route:   GET /api/contact  (admin only)
    Purpose: Return all received messages, newest first.
    Inputs:  Authorization: Bearer <jwt>.
    Output:  list of message objects.
    """
    cursor = get_contacts_collection().find().sort("created_at", -1)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)
    return items
