"""
Contact routes.

Base path: /api/contact
Purpose:   Accept messages from the site's Contact form (saved to MongoDB) and
           let the admin read them.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.database import get_contacts_collection
from app.middlewares.auth_middleware import require_admin
from app.schemas.contact import ContactCreate

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("", status_code=201)
async def create_contact(body: ContactCreate) -> dict:
    """
    Route:   POST /api/contact
    Purpose: Store a visitor's message.
    Inputs:  JSON body {name, email, subject?, message}.
    Output:  {success: true, id} of the stored message.
    Example: POST /api/contact {"name":"HR","email":"a@b.c","message":"Hi"}
    """
    doc = body.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await get_contacts_collection().insert_one(doc)
    return {"success": True, "id": str(result.inserted_id)}


@router.get("", dependencies=[Depends(require_admin)])
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
