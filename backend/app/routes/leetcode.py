"""
LeetCode routes.

Base path: /api/leetcode
Purpose:   Serve admin-synced LeetCode stats (no live GraphQL on public reads).
"""

from fastapi import APIRouter

from app.schemas.leetcode import LeetCodeStats
from app.services.leetcode_service import get_cached_stats

router = APIRouter(prefix="/api/leetcode", tags=["leetcode"])


@router.get("/stats", response_model=LeetCodeStats)
async def get_stats() -> dict:
    """
    Route:   GET /api/leetcode/stats
    Purpose: Return last admin-synced stats (fallback if never synced).
    Output:  LeetCodeStats object.
    """
    return await get_cached_stats()
