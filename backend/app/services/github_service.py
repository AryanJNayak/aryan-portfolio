"""
GitHub service.

Purpose:
    Fetch the user's PUBLIC repositories from the GitHub REST API so they can be
    shown in the Projects section. Results are cached in MongoDB for 1 hour to
    respect GitHub rate limits.

Inputs:
    settings.GITHUB_USERNAME, optional settings.GITHUB_TOKEN.

Output:
    list[dict] of normalized repo records.

Example:
    repos = await fetch_public_repos()
    # -> [{"name": "AI-Job-Search", "github_url": "...", "stars": 0, ...}, ...]
"""

from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings
from app.database import get_cache_collection

_CACHE_KEY = "github_repos"
_CACHE_TTL = timedelta(hours=1)
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


async def fetch_public_repos(force_refresh: bool = False) -> list[dict]:
    """
    Purpose: Return the user's public repos, using a 1-hour MongoDB cache.
    Inputs:  force_refresh (bool) - bypass the cache when True.
    Output:  list[dict] of normalized repos (sorted by stars then recency).
    Example: await fetch_public_repos()
    """
    cache = get_cache_collection()

    # Cache is a best-effort optimization: if MongoDB is unreachable we still
    # fetch live from GitHub below rather than failing the request.
    if not force_refresh:
        try:
            cached = await cache.find_one({"_id": _CACHE_KEY})
            if cached and cached["expires_at"] > datetime.now(timezone.utc):
                return cached["data"]
        except Exception:
            pass

    headers = {"Accept": "application/vnd.github+json"}
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    url = f"{_GITHUB_API}/users/{settings.GITHUB_USERNAME}/repos"
    params = {"per_page": 100, "sort": "updated", "type": "owner"}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        raw = resp.json()

    repos = [_normalize_repo(r) for r in raw if not r.get("fork")]
    repos.sort(key=lambda r: (r["stars"], r["updated_at"] or ""), reverse=True)

    # Store/refresh the cache document (ignore failures if DB is down).
    try:
        await cache.update_one(
            {"_id": _CACHE_KEY},
            {
                "$set": {
                    "data": repos,
                    "expires_at": datetime.now(timezone.utc) + _CACHE_TTL,
                }
            },
            upsert=True,
        )
    except Exception:
        pass
    return repos


def _parse_github_repo(github_url: str) -> tuple[str, str] | None:
    """
    Purpose: Extract (owner, repo) from a GitHub repository URL.
    Inputs:  github_url (str) - e.g. https://github.com/AryanJNayak/MyRepo
    Output:  (owner, repo) or None if the URL is not a GitHub repo link.
    """
    if not github_url:
        return None
    try:
        # Strip query/fragment and optional .git suffix.
        cleaned = github_url.strip().rstrip("/").split("?")[0].split("#")[0]
        if cleaned.endswith(".git"):
            cleaned = cleaned[:-4]
        parts = cleaned.replace("https://", "").replace("http://", "").split("/")
        # Expect: github.com / owner / repo [/...]
        if len(parts) < 3 or parts[0].lower() != "github.com":
            return None
        owner, repo = parts[1], parts[2]
        if not owner or not repo:
            return None
        return owner, repo
    except Exception:
        return None


async def fetch_readme(github_url: str) -> dict | None:
    """
    Purpose: Fetch a repository's README from the GitHub Contents API (HTML
             rendered by GitHub so images/links work without a markdown lib).
    Inputs:  github_url (str) - full https://github.com/owner/repo URL.
    Output:  {name, html, download_url} or None if missing / unreachable.
    Example: await fetch_readme("https://github.com/AryanJNayak/MyRepo")
    """
    parsed = _parse_github_repo(github_url)
    if not parsed:
        return None
    owner, repo = parsed

    cache = get_cache_collection()
    cache_key = f"github_readme:{owner}/{repo}".lower()

    try:
        cached = await cache.find_one({"_id": cache_key})
        if cached and cached["expires_at"] > datetime.now(timezone.utc):
            return cached["data"]
    except Exception:
        pass

    headers = {
        # Ask GitHub to return the README already rendered as HTML.
        "Accept": "application/vnd.github.html",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

    url = f"{_GITHUB_API}/repos/{owner}/{repo}/readme"

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            # With Accept: html, the body IS the rendered HTML string.
            html = resp.text
            data = {
                "name": "README.md",
                "html": html,
                "repo": f"{owner}/{repo}",
                "github_url": f"https://github.com/{owner}/{repo}",
            }
    except httpx.HTTPError:
        return None

    try:
        await cache.update_one(
            {"_id": cache_key},
            {
                "$set": {
                    "data": data,
                    "expires_at": datetime.now(timezone.utc) + _CACHE_TTL,
                }
            },
            upsert=True,
        )
    except Exception:
        pass

    return data
