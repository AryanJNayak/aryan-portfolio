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


async def benchmark_cache(rounds: int = 5) -> dict:
    """
    Purpose: Compare Redis vs MongoDB read latency for synced portfolio keys.
    Inputs:  rounds (int) - timed reads per store (clamped 1–20).
    Output:  per-key samples + averages (server-side store latency only).
    """
    import time

    from app.redis_client import ping_redis

    rounds = max(1, min(int(rounds), 20))
    keys = [KEY_MERGED_PROJECTS, KEY_GITHUB_REPOS, KEY_LEETCODE_STATS, KEY_SYNC_META]
    redis_ok = await ping_redis()

    results: dict[str, Any] = {
        "rounds": rounds,
        "redis_configured": redis_ok,
        "keys": {},
        "summary": {},
    }

    all_redis_ms: list[float] = []
    all_mongo_ms: list[float] = []

    for cache_id in keys:
        redis_samples: list[float] = []
        mongo_samples: list[float] = []
        redis_hit = False
        mongo_hit = False

        for _ in range(rounds):
            if redis_ok:
                start = time.perf_counter()
                data = await redis_get_json(_redis_key(cache_id))
                redis_samples.append(round((time.perf_counter() - start) * 1000, 3))
                if data is not None:
                    redis_hit = True

            start = time.perf_counter()
            try:
                doc = await get_cache_collection().find_one({"_id": cache_id})
                data = doc.get("data") if doc else None
            except Exception:
                data = None
            mongo_samples.append(round((time.perf_counter() - start) * 1000, 3))
            if data is not None:
                mongo_hit = True

        redis_avg = (
            round(sum(redis_samples) / len(redis_samples), 3) if redis_samples else None
        )
        mongo_avg = (
            round(sum(mongo_samples) / len(mongo_samples), 3) if mongo_samples else None
        )
        speedup = (
            round(mongo_avg / redis_avg, 2)
            if redis_avg and mongo_avg and redis_avg > 0
            else None
        )

        results["keys"][cache_id] = {
            "redis_hit": redis_hit if redis_ok else False,
            "mongo_hit": mongo_hit,
            "redis_ms": redis_samples,
            "mongo_ms": mongo_samples,
            "redis_avg_ms": redis_avg,
            "mongo_avg_ms": mongo_avg,
            "speedup": speedup,
        }
        all_redis_ms.extend(redis_samples)
        all_mongo_ms.extend(mongo_samples)

    redis_avg = (
        round(sum(all_redis_ms) / len(all_redis_ms), 3) if all_redis_ms else None
    )
    mongo_avg = (
        round(sum(all_mongo_ms) / len(all_mongo_ms), 3) if all_mongo_ms else None
    )
    results["summary"] = {
        "redis_avg_ms": redis_avg,
        "mongo_avg_ms": mongo_avg,
        "speedup": (
            round(mongo_avg / redis_avg, 2)
            if redis_avg and mongo_avg and redis_avg > 0
            else None
        ),
        "note": (
            "Server-side store latencies (backend → Redis / Mongo). "
            "Browser time also includes network + FastAPI overhead."
        ),
    }
    return results
