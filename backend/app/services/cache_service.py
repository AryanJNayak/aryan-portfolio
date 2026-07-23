"""
Durable + fast cache (MongoDB + Redis).

Purpose:
    Store admin-synced payloads. Public reads: Redis → MongoDB. Never call
    GitHub/LeetCode from here — only admin sync writes fresh official data.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.database import get_cache_collection
from app.redis_client import redis_delete, redis_get_json, redis_set_json

# Redis key prefix keeps portfolio keys namespaced on shared instances.
_REDIS_PREFIX = "portfolio:"

KEY_GITHUB_REPOS = "github_repos"
KEY_LEETCODE_STATS = "leetcode_stats"
KEY_MERGED_PROJECTS = "merged_projects"
KEY_SYNC_META = "sync_meta"


def readme_key(owner: str, repo: str) -> str:
    """Purpose: Stable cache id for a repo README."""
    return f"github_readme:{owner}/{repo}".lower()


def _redis_key(cache_id: str) -> str:
    return f"{_REDIS_PREFIX}{cache_id}"


async def cache_get(cache_id: str) -> Any | None:
    """
    Purpose: Read cached data — Redis first, then MongoDB.
    Inputs:  cache_id (str) - logical key (also Mongo `_id`).
    Output:  stored payload or None.
    """
    cached = await redis_get_json(_redis_key(cache_id))
    if cached is not None:
        return cached

    try:
        doc = await get_cache_collection().find_one({"_id": cache_id})
        if not doc:
            return None
        data = doc.get("data")
        # Warm Redis for subsequent public hits.
        if data is not None:
            await redis_set_json(_redis_key(cache_id), data)
        return data
    except Exception:
        return None


async def cache_set(cache_id: str, data: Any) -> None:
    """
    Purpose: Persist data to MongoDB and Redis after an admin sync (or rebuild).
    Inputs:  cache_id (str), data (JSON-serializable).
    """
    now = datetime.now(timezone.utc)
    try:
        await get_cache_collection().update_one(
            {"_id": cache_id},
            {
                "$set": {
                    "data": data,
                    "synced_at": now,
                    # Keep field for older code paths; no auto-expiry in new model.
                    "expires_at": now,
                }
            },
            upsert=True,
        )
    except Exception:
        pass

    await redis_set_json(_redis_key(cache_id), data)


async def cache_delete(cache_id: str) -> None:
    """Purpose: Remove a cache entry from Mongo + Redis."""
    try:
        await get_cache_collection().delete_one({"_id": cache_id})
    except Exception:
        pass
    await redis_delete(_redis_key(cache_id))


async def get_sync_meta() -> dict:
    """Purpose: Return last admin sync metadata (or empty defaults)."""
    meta = await cache_get(KEY_SYNC_META)
    if isinstance(meta, dict):
        return meta
    return {"last_synced_at": None, "sources": {}}
