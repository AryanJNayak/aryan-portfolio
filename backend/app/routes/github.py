"""
GitHub routes.

Base path: /api/github
Purpose:   Serve cached GitHub repos / READMEs (populated by admin sync only).
"""

from fastapi import APIRouter, HTTPException, Query

from app.services.github_service import get_cached_readme, get_cached_repos

router = APIRouter(prefix="/api/github", tags=["github"])


@router.get("/repos")
async def get_repos() -> list[dict]:
    """
    Route:   GET /api/github/repos
    Purpose: Return last admin-synced public repositories (no live GitHub call).
    Output:  list of normalized repo dicts (possibly empty before first sync).
    """
    return await get_cached_repos()


@router.get("/readme")
async def get_readme(
    url: str = Query(..., description="Full GitHub repository URL"),
) -> dict:
    """
    Route:   GET /api/github/readme?url=https://github.com/owner/repo
    Purpose: Return the last admin-synced README HTML for a repository.
    Inputs:  query `url` (str) - https://github.com/{owner}/{repo}
    Output:  {name, html, repo, github_url}; 404 if not synced / missing.
    """
    readme = await get_cached_readme(url)
    if not readme:
        raise HTTPException(
            status_code=404,
            detail="README not found. Run Admin → Sync Data if this repo was added recently.",
        )
    return readme
