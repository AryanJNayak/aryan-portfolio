"""
LeetCode schemas.

Purpose:
    Shape the stats card returned to the frontend: solved counts, contest rating,
    ranking KPIs, and top contest performances.
"""

from pydantic import BaseModel


class ContestEntry(BaseModel):
    """A single ranked contest performance."""

    title: str
    ranking: int | None = None
    total_participants: int | None = None  # e.g. 33040 for "Rank 5737 / 33040"
    rating: float | None = None
    percentage_top: float | None = None  # e.g. 17.0 means "Top 17%"


class LeetCodeStats(BaseModel):
    """
    Purpose: Full LeetCode mini-profile payload.
    Output:  username, profile_url, solved breakdown, rating, KPIs, top contests.
    Example: {"username": "Jsjsn73", "current_rating": 1440.2, ...}
    """

    username: str
    profile_url: str
    ranking: int | None = None
    total_solved: int = 0
    easy_solved: int = 0
    medium_solved: int = 0
    hard_solved: int = 0
    total_questions: int = 0
    acceptance_rate: float | None = None
    current_rating: float | None = None
    highest_rating: float | None = None
    global_ranking: int | None = None
    attended_contests: int = 0
    top_contests: list[ContestEntry] = []
