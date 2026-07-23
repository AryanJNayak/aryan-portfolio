"""
Media service (GridFS).

Purpose:
    Store and stream uploaded images/videos directly inside MongoDB Atlas using
    GridFS, so no external storage (S3/Cloudinary) is required.

Example:
    file_id = await save_media(b"...", "shot.png", "image/png")
    stream, content_type, length = await open_media(file_id)
"""

from bson import ObjectId

from app.database import get_gridfs_bucket


async def save_media(data: bytes, filename: str, content_type: str) -> str:
    """
    Purpose: Persist a media file in GridFS.
    Inputs:  data (bytes), filename (str), content_type (str, e.g. "image/png").
    Output:  str - the GridFS file id (used to build "/api/media/{id}").
    """
    bucket = get_gridfs_bucket()
    file_id = await bucket.upload_from_stream(
        filename, data, metadata={"content_type": content_type}
    )
    return str(file_id)


async def open_media(file_id: str):
    """
    Purpose: Open a stored media file for streaming back to the client.
    Inputs:  file_id (str) - GridFS id.
    Output:  tuple(grid_out_stream, content_type: str, length: int) or None.
    Example: await open_media("665...")
    """
    if not ObjectId.is_valid(file_id):
        return None
    bucket = get_gridfs_bucket()
    stream = await bucket.open_download_stream(ObjectId(file_id))
    content_type = (stream.metadata or {}).get("content_type", "application/octet-stream")
    return stream, content_type, stream.length


async def delete_media(file_id: str) -> bool:
    """
    Purpose: Remove a media file from GridFS.
    Inputs:  file_id (str).
    Output:  True on success, False if id invalid/missing.
    """
    if not ObjectId.is_valid(file_id):
        return False
    try:
        await get_gridfs_bucket().delete(ObjectId(file_id))
        return True
    except Exception:
        return False
