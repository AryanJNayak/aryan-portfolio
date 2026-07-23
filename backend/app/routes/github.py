"""
GitHub routes.

Base path: /api/github
Purpose:   Expose the raw list of public GitHub repositories (used by the admin
           panel when enriching a repo into a curated project).
"""

from fastapi import APIRouter, HTTPException, Query

from app.services.github_service import fetch_public_repos, fetch_readme

router = APIRouter(prefix="/api/github", tags=["github"])


@router.get("/repos")
async def get_repos(refresh: bool = False) -> list[dict]:
    """
    Route:   GET /api/github/repos?refresh=false
    Purpose: Return the user's public repositories (cached 1h).
    Inputs:  query `refresh` (bool) - force a live refetch.
    Output:  list of normalized repo dicts.
    Example: GET /api/github/repos
    """
    return await fetch_public_repos(force_refresh=refresh)


@router.get("/readme")
async def get_readme(
    url: str = Query(..., description="Full GitHub repository URL"),
) -> dict:
    """
    Route:   GET /api/github/readme?url=https://github.com/owner/repo
    Purpose: Fetch the repository README (HTML rendered by GitHub) for the
             project detail page.
    Inputs:  query `url` (str) - https://github.com/{owner}/{repo}
    Output:  {name, html, repo, github_url}; 404 if no README.
    """
    readme = await fetch_readme(url)
    if not readme:
        raise HTTPException(status_code=404, detail="README not found for this repository")
    return readme
