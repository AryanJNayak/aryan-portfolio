"""
MongoDB Atlas connection layer.

Purpose:
    Provide a single async Motor client + database handle and a GridFS bucket for
    storing uploaded media (images/videos). Collections are exposed as helpers.

Inputs:
    settings.MONGODB_URI, settings.DB_NAME (from config).

Output:
    Async database/collection handles used across services and routes.

Example:
    from app.database import get_projects_collection
    docs = await get_projects_collection().find().to_list(100)
"""

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
    AsyncIOMotorGridFSBucket,
)

from app.config import settings

# A single shared client for the whole process (Motor manages the pool).
# `serverSelectionTimeoutMS` keeps startup/health checks fast: if the DB is
# unreachable we fail in ~5s instead of blocking the whole app for 30s.
_client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.MONGODB_URI, serverSelectionTimeoutMS=5000
)
_db: AsyncIOMotorDatabase = _client[settings.DB_NAME]


def get_database() -> AsyncIOMotorDatabase:
    """
    Purpose: Return the active database handle.
    Output:  AsyncIOMotorDatabase for `settings.DB_NAME`.
    """
    return _db


def get_projects_collection():
    """Purpose: Access the `projects` collection. Output: Motor collection."""
    return _db["projects"]


def get_contacts_collection():
    """Purpose: Access the `contacts` collection (contact-form messages)."""
    return _db["contacts"]


def get_cache_collection():
    """Purpose: Access the `cache` collection (admin-synced GitHub/LeetCode/projects)."""
    return _db["cache"]


def get_gridfs_bucket() -> AsyncIOMotorGridFSBucket:
    """
    Purpose: Return a GridFS bucket for streaming media in/out of MongoDB.
    Output:  AsyncIOMotorGridFSBucket bound to the active database.
    """
    return AsyncIOMotorGridFSBucket(_db, bucket_name="media")


async def ping() -> bool:
    """
    Purpose: Health-check the database connection at startup.
    Output:  True if the server responds to a ping, else raises.
    Example: await ping()  # -> True
    """
    await _client.admin.command("ping")
    return True
