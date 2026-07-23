"""
LeetCode routes.

Base path: /api/leetcode
Purpose:   Serve the LeetCode mini-profile (rating, KPIs, top contests) for the
           stats card, cached 6 hours.
"""

from fastapi import APIRouter

from app.schemas.leetcode import LeetCodeStats
from app.services.leetcode_service import fetch_leetcode_stats

router = APIRouter(prefix="/api/leetcode", tags=["leetcode"])


@router.get("/stats", response_model=LeetCodeStats)
async def get_stats(refresh: bool = False) -> dict:
    """
    Route:   GET /api/leetcode/stats?refresh=false
    Purpose: Return solved counts, contest rating, ranking and top contests.
    Inputs:  query `refresh` (bool) - bypass the 6h cache.
    Output:  LeetCodeStats object.
    Example: GET /api/leetcode/stats
    """
    return await fetch_leetcode_stats(force_refresh=refresh)
