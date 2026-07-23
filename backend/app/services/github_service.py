"""
GitHub service.

Purpose:
    Fetch PUBLIC repositories / READMEs from the GitHub REST API during admin
    sync only. Public requests read from Redis → MongoDB and never call GitHub.
"""

from __future__ import annotations

import httpx

from app.config import settings
from app.services import cache_service

_GITHUB_API = "https://api.github.com"


def _normalize_repo(repo: dict) -> dict:
    """
    Purpose: Reduce a raw GitHub repo object to the fields the UI needs.
    Inputs:  repo (dict) - a single item from the GitHub repos endpoint.
    Output:  dict with name, description, url, stars, language, topics, dates.
    """
    return {
        "name": repo.get("name"),
        "description": repo.get("description") or "",
        "github_url": repo.get("html_url"),
        "demo_url": repo.get("homepage") or None,
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "language": repo.get("language"),
        "topics": repo.get("topics", []),
        "created_at": repo.get("created_at"),
        "updated_at": repo.get("pushed_at"),
    }


def _auth_headers(*, html: bool = False) -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.html" if html else "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


async def get_cached_repos() -> list[dict]:
    """
    Purpose: Public read — return last admin-synced repos (no live GitHub call).
    Output:  list[dict] (may be empty if never synced).
    """
    data = await cache_service.cache_get(cache_service.KEY_GITHUB_REPOS)
    return data if isinstance(data, list) else []


async def sync_public_repos() -> list[dict]:
    """
    Purpose: Admin sync — live fetch from GitHub and persist to Mongo + Redis.
    Output:  list[dict] of normalized repos.
    """
    url = f"{_GITHUB_API}/users/{settings.GITHUB_USERNAME}/repos"
    params = {"per_page": 100, "sort": "updated", "type": "owner"}

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(url, headers=_auth_headers(), params=params)
        resp.raise_for_status()
        raw = resp.json()

    repos = [_normalize_repo(r) for r in raw if not r.get("fork")]
    repos.sort(key=lambda r: (r["stars"], r["updated_at"] or ""), reverse=True)
    await cache_service.cache_set(cache_service.KEY_GITHUB_REPOS, repos)
    return repos


# Backwards-compatible name used by older callers / admin listing.
async def fetch_public_repos(force_refresh: bool = False) -> list[dict]:
    """
    Purpose: Compatibility wrapper.
    Inputs:  force_refresh - if True, live sync; else cached read only.
    """
    if force_refresh:
        return await sync_public_repos()
    return await get_cached_repos()


def _parse_github_repo(github_url: str) -> tuple[str, str] | None:
    """
    Purpose: Extract (owner, repo) from a GitHub repository URL.
    Inputs:  github_url (str) - e.g. https://github.com/AryanJNayak/MyRepo
    Output:  (owner, repo) or None if the URL is not a GitHub repo link.
    """
    if not github_url:
        return None
    try:
        cleaned = github_url.strip().rstrip("/").split("?")[0].split("#")[0]
        if cleaned.endswith(".git"):
            cleaned = cleaned[:-4]
        parts = cleaned.replace("https://", "").replace("http://", "").split("/")
        if len(parts) < 3 or parts[0].lower() != "github.com":
            return None
        owner, repo = parts[1], parts[2]
        if not owner or not repo:
            return None
        return owner, repo
    except Exception:
        return None


async def get_cached_readme(github_url: str) -> dict | None:
    """
    Purpose: Public read — return last synced README HTML (no live GitHub call).
    """
    parsed = _parse_github_repo(github_url)
    if not parsed:
        return None
    owner, repo = parsed
    data = await cache_service.cache_get(cache_service.readme_key(owner, repo))
    return data if isinstance(data, dict) else None


async def sync_readme(github_url: str) -> dict | None:
    """
    Purpose: Admin sync — live fetch README and persist to Mongo + Redis.
    """
    parsed = _parse_github_repo(github_url)
    if not parsed:
        return None
    owner, repo = parsed

    url = f"{_GITHUB_API}/repos/{owner}/{repo}/readme"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers=_auth_headers(html=True))
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            data = {
                "name": "README.md",
                "html": resp.text,
                "repo": f"{owner}/{repo}",
                "github_url": f"https://github.com/{owner}/{repo}",
            }
    except httpx.HTTPError:
        return None

    await cache_service.cache_set(cache_service.readme_key(owner, repo), data)
    return data


async def fetch_readme(github_url: str) -> dict | None:
    """Purpose: Public README helper — cache only (no live fetch)."""
    return await get_cached_readme(github_url)
