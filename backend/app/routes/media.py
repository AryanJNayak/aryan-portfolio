"""
Media routes (GridFS).

Base path: /api/media
Purpose:   Admin uploads images/videos; anyone can stream them back by id.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.middlewares.auth_middleware import require_admin
from app.services import media_service

router = APIRouter(prefix="/api/media", tags=["media"])

# Only allow common web-safe image/video types.
_ALLOWED = {
    "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml",
    "video/mp4", "video/webm",
}


@router.post("", dependencies=[Depends(require_admin)], status_code=201)
async def upload_media(file: UploadFile = File(...)) -> dict:
    """
    Route:   POST /api/media  (admin only, multipart/form-data)
    Purpose: Store an uploaded image/video in GridFS.
    Inputs:  form field `file` (UploadFile); Authorization header.
    Output:  {id, url, content_type} where url = "/api/media/{id}".
    Example: POST /api/media  (file=@screenshot.png)
    """
    if file.content_type not in _ALLOWED:
        raise HTTPException(status_code=400, detail=f"Unsupported type: {file.content_type}")
    data = await file.read()
    file_id = await media_service.save_media(data, file.filename or "upload", file.content_type)
    return {"id": file_id, "url": f"/api/media/{file_id}", "content_type": file.content_type}


@router.get("/{file_id}")
async def get_media(file_id: str) -> StreamingResponse:
    """
    Route:   GET /api/media/{file_id}
    Purpose: Stream a stored media file back to the browser.
    Inputs:  path `file_id` (GridFS id).
    Output:  binary stream with the correct Content-Type; 404 if missing.
    Example: <img src="/api/media/665..." />
    """
    result = await media_service.open_media(file_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Media not found")
    stream, content_type, length = result
    return StreamingResponse(
        stream,
        media_type=content_type,
        headers={"Content-Length": str(length), "Cache-Control": "public, max-age=86400"},
    )


@router.delete("/{file_id}", dependencies=[Depends(require_admin)])
async def delete_media(file_id: str) -> dict:
    """
    Route:   DELETE /api/media/{file_id}  (admin only)
    Purpose: Delete a stored media file.
    Output:  {success: bool}.
    """
    ok = await media_service.delete_media(file_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Media not found")
    return {"success": True}
