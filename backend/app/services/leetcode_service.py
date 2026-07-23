"""
LeetCode service.

Purpose:
    LeetCode has no official public API. This service queries LeetCode's public
    GraphQL endpoint to build a stats card (solved counts, contest rating, global
    ranking, attended contests) and merges known "top contest" highlights. Results
    are cached in MongoDB for 6 hours.

Inputs:
    settings.LEETCODE_USERNAME.

Output:
    dict matching the LeetCodeStats schema.

Example:
    stats = await fetch_leetcode_stats()
    # -> {"username": "Jsjsn73", "current_rating": 1440.2, ...}
"""

from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings
from app.database import get_cache_collection

_CACHE_KEY = "leetcode_stats"
_CACHE_TTL = timedelta(hours=6)
_LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

# Verified top contest highlights (rank out of total participants).
# Always shown in the "Top Contest Performances" section.
_KNOWN_TOP_CONTESTS = [
    {
        "title": "Weekly Contest 467",
        "ranking": 5737,
        "total_participants": 33040,
        "percentage_top": round(5737 / 33040 * 100, 1),  # ~17.4%
    },
    {
        "title": "Weekly Contest 479",
        "ranking": 5946,
        "total_participants": 26317,
        "percentage_top": round(5946 / 26317 * 100, 1),  # ~22.6%
    },
    {
        "title": "Weekly Contest 448",
        "ranking": 6539,
        "total_participants": 21863,
        "percentage_top": round(6539 / 21863 * 100, 1),  # ~29.9%
    },
]
_KNOWN_HIGHEST_RATING = 1492.0

# GraphQL documents (public, unauthenticated).
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
    """
    Purpose: Execute one GraphQL query against LeetCode.
    Inputs:  client (httpx), query (str), username (str).
    Output:  the `data` object from the response (or {} on error).
    """
    resp = await client.post(
        _LEETCODE_GRAPHQL,
        json={"query": query, "variables": {"username": username}},
        headers={"Referer": "https://leetcode.com", "Content-Type": "application/json"},
    )
    resp.raise_for_status()
    return resp.json().get("data", {}) or {}


def _build_stats(username: str, profile: dict, contest: dict) -> dict:
    """
    Purpose: Merge raw GraphQL responses into the LeetCodeStats shape.
    Inputs:  username, profile-data dict, contest-data dict.
    Output:  dict ready to be returned by the API.
    """
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
    history = [h for h in ((contest or {}).get("userContestRankingHistory") or []) if h.get("attended")]

    # Enrich curated highlights with live contest ratings when titles match.
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


def _fallback_stats(username: str) -> dict:
    """
    Purpose: Provide resume-verified stats if LeetCode blocks the request.
    Output:  A minimal-but-truthful stats dict.
    """
    return {
        "username": username,
        "profile_url": f"https://leetcode.com/u/{username}/",
        "current_rating": _KNOWN_HIGHEST_RATING,
        "highest_rating": _KNOWN_HIGHEST_RATING,
        "top_contests": _KNOWN_TOP_CONTESTS,
    }


async def fetch_leetcode_stats(force_refresh: bool = False) -> dict:
    """
    Purpose: Return LeetCode stats, cached for 6 hours in MongoDB.
    Inputs:  force_refresh (bool) - bypass cache when True.
    Output:  dict matching the LeetCodeStats schema.
    Example: await fetch_leetcode_stats()
    """
    username = settings.LEETCODE_USERNAME
    cache = get_cache_collection()

    # Cache is best-effort; a DB outage must not break the stats endpoint.
    if not force_refresh:
        try:
            cached = await cache.find_one({"_id": _CACHE_KEY})
            if cached and cached["expires_at"] > datetime.now(timezone.utc):
                return cached["data"]
        except Exception:
            pass

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            profile = await _post_graphql(client, _PROFILE_QUERY, username)
            contest = await _post_graphql(client, _CONTEST_QUERY, username)
        stats = _build_stats(username, profile, contest)
    except (httpx.HTTPError, KeyError, TypeError):
        # Never fail the endpoint: fall back to verified resume data.
        stats = _fallback_stats(username)

    try:
        await cache.update_one(
            {"_id": _CACHE_KEY},
            {"$set": {"data": stats, "expires_at": datetime.now(timezone.utc) + _CACHE_TTL}},
            upsert=True,
        )
    except Exception:
        pass
    return stats
