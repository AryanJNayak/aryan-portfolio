"""
Admin routes.

Base path: /api/admin
Purpose:   Authenticated operations that refresh official external data into
           MongoDB + Redis for public consumption.
"""

from fastapi import APIRouter, Depends, Query

from app.middlewares.auth_middleware import require_admin
from app.services import cache_service
from app.services.sync_service import run_full_sync

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/sync", dependencies=[Depends(require_admin)])
async def sync_portfolio_data() -> dict:
    """
    Route:   POST /api/admin/sync  (admin only)
    Purpose: Live-fetch GitHub + LeetCode (+ READMEs), store in DB/Redis.
             Public endpoints only serve this synced data afterward.
    Output:  {ok, synced_at, sources: {...}}
    """
    return await run_full_sync()


@router.get("/sync/status", dependencies=[Depends(require_admin)])
async def sync_status() -> dict:
    """
    Route:   GET /api/admin/sync/status  (admin only)
    Purpose: Show when data was last synced by the admin.
    Output:  {last_synced_at, ok, sources}
    """
    return await cache_service.get_sync_meta()


@router.get("/cache-benchmark", dependencies=[Depends(require_admin)])
async def cache_benchmark(rounds: int = Query(5, ge=1, le=20)) -> dict:
    """
    Route:   GET /api/admin/cache-benchmark?rounds=5  (admin only)
    Purpose: Time Redis vs MongoDB reads for synced keys (server-side).
    Output:  {rounds, redis_configured, keys, summary}
    """
    return await cache_service.benchmark_cache(rounds=rounds)
