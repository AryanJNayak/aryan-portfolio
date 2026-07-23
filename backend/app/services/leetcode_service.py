"""
LeetCode service.

Purpose:
    Query LeetCode's public GraphQL endpoint during admin sync only. Public
    requests read Redis → MongoDB and never call LeetCode.
"""

from __future__ import annotations

import httpx

from app.config import settings
from app.services import cache_service

_LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

# Verified top contest highlights (rank out of total participants).
_KNOWN_TOP_CONTESTS = [
    {
        "title": "Weekly Contest 467",
        "ranking": 5737,
        "total_participants": 33040,
        "percentage_top": round(5737 / 33040 * 100, 1),
    },
    {
        "title": "Weekly Contest 479",
        "ranking": 5946,
        "total_participants": 26317,
        "percentage_top": round(5946 / 26317 * 100, 1),
    },
    {
        "title": "Weekly Contest 448",
        "ranking": 6539,
        "total_participants": 21863,
        "percentage_top": round(6539 / 21863 * 100, 1),
    },
]
_KNOWN_HIGHEST_RATING = 1492.0

_PROFILE_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
  allQuestionsCount { difficulty count }
}
"""

_CONTEST_QUERY = """
query userContestRanking($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
  }
  userContestRankingHistory(username: $username) {
    attended
    ranking
    rating
    contest { title }
  }
}
"""


async def _post_graphql(client: httpx.AsyncClient, query: str, username: str) -> dict:
    """Purpose: Execute one GraphQL query against LeetCode."""
    resp = await client.post(
        _LEETCODE_GRAPHQL,
        json={"query": query, "variables": {"username": username}},
        headers={"Referer": "https://leetcode.com", "Content-Type": "application/json"},
    )
    resp.raise_for_status()
    return resp.json().get("data", {}) or {}


def _build_stats(username: str, profile: dict, contest: dict) -> dict:
    """Purpose: Merge raw GraphQL responses into the LeetCodeStats shape."""
    matched = (profile or {}).get("matchedUser") or {}
    submit = {
        item["difficulty"]: item["count"]
        for item in (matched.get("submitStatsGlobal", {}) or {}).get("acSubmissionNum", [])
    }
    totals = {
        item["difficulty"]: item["count"]
        for item in (profile or {}).get("allQuestionsCount", [])
    }

    ranking = (contest or {}).get("userContestRanking") or {}
    history = [
        h for h in ((contest or {}).get("userContestRankingHistory") or []) if h.get("attended")
    ]

    rating_by_title = {
        h["contest"]["title"]: round(h["rating"], 1) if h.get("rating") else None
        for h in history
        if h.get("contest", {}).get("title")
    }
    top_contests = [
        {**entry, "rating": rating_by_title.get(entry["title"])}
        for entry in _KNOWN_TOP_CONTESTS
    ]

    live_rating = ranking.get("rating")

    return {
        "username": username,
        "profile_url": f"https://leetcode.com/u/{username}/",
        "ranking": matched.get("profile", {}).get("ranking"),
        "total_solved": submit.get("All", 0),
        "easy_solved": submit.get("Easy", 0),
        "medium_solved": submit.get("Medium", 0),
        "hard_solved": submit.get("Hard", 0),
        "total_questions": totals.get("All", 0),
        "current_rating": round(live_rating, 1) if live_rating else _KNOWN_HIGHEST_RATING,
        "highest_rating": max(
            _KNOWN_HIGHEST_RATING, round(live_rating, 1) if live_rating else 0
        ),
        "global_ranking": ranking.get("globalRanking"),
        "attended_contests": ranking.get("attendedContestsCount", 0),
        "top_contests": top_contests,
    }


def fallback_stats(username: str | None = None) -> dict:
    """Purpose: Resume-verified stats when nothing is cached / LeetCode fails."""
    name = username or settings.LEETCODE_USERNAME
    return {
        "username": name,
        "profile_url": f"https://leetcode.com/u/{name}/",
        "current_rating": _KNOWN_HIGHEST_RATING,
        "highest_rating": _KNOWN_HIGHEST_RATING,
        "top_contests": _KNOWN_TOP_CONTESTS,
    }


async def get_cached_stats() -> dict:
    """
    Purpose: Public read — last admin-synced stats (no live LeetCode call).
    Output:  stats dict, or hardcoded fallback if never synced.
    """
    data = await cache_service.cache_get(cache_service.KEY_LEETCODE_STATS)
    if isinstance(data, dict):
        return data
    return fallback_stats()


async def sync_leetcode_stats() -> dict:
    """
    Purpose: Admin sync — live fetch from LeetCode and persist to Mongo + Redis.
    """
    username = settings.LEETCODE_USERNAME
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            profile = await _post_graphql(client, _PROFILE_QUERY, username)
            contest = await _post_graphql(client, _CONTEST_QUERY, username)
        stats = _build_stats(username, profile, contest)
    except (httpx.HTTPError, KeyError, TypeError):
        stats = fallback_stats(username)

    await cache_service.cache_set(cache_service.KEY_LEETCODE_STATS, stats)
    return stats


async def fetch_leetcode_stats(force_refresh: bool = False) -> dict:
    """Purpose: Compatibility wrapper — live only when force_refresh=True."""
    if force_refresh:
        return await sync_leetcode_stats()
    return await get_cached_stats()
