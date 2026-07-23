"""
Redis connection helper.

Purpose:
    Provide an optional async Redis client for fast public reads. When REDIS_URL
    is unset or Redis is unreachable, callers fall back to MongoDB only.
"""

from __future__ import annotations

import json
from typing import Any

from app.config import settings

_redis = None
_redis_failed = False


async def get_redis():
    """
    Purpose: Lazily connect to Redis once per process.
    Output:  redis.asyncio.Redis instance, or None if disabled/unreachable.
    """
    global _redis, _redis_failed

    if not settings.REDIS_URL or _redis_failed:
        return None
    if _redis is not None:
        return _redis

    try:
        from redis.asyncio import Redis

        client = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        await client.ping()
        _redis = client
        return _redis
    except Exception as exc:  # pragma: no cover - logged at startup / first use
        _redis_failed = True
        print(f"[redis] Unavailable ({exc}); using MongoDB cache only.")
        return None


async def redis_get_json(key: str) -> Any | None:
    """Purpose: Read a JSON value from Redis. Output: parsed object or None."""
    client = await get_redis()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception:
        return None


async def redis_set_json(key: str, value: Any) -> bool:
    """
    Purpose: Write a JSON value to Redis with no TTL (valid until next admin sync).
    Output:  True on success, False if Redis is down.
    """
    client = await get_redis()
    if client is None:
        return False
    try:
        await client.set(key, json.dumps(value, default=str))
        return True
    except Exception:
        return False


async def redis_delete(*keys: str) -> None:
    """Purpose: Delete one or more Redis keys (best-effort)."""
    client = await get_redis()
    if client is None or not keys:
        return
    try:
        await client.delete(*keys)
    except Exception:
        pass


async def ping_redis() -> bool:
    """Purpose: Health-check Redis. Output: True if reachable."""
    client = await get_redis()
    if client is None:
        return False
    try:
        await client.ping()
        return True
    except Exception:
        return False
