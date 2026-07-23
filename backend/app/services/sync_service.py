"""
Admin data sync orchestrator.

Purpose:
    Single entry point used by POST /api/admin/sync. Pulls live data from
    GitHub + LeetCode, stores it in MongoDB + Redis, and rebuilds the public
    merged projects cache. Public traffic never hits those APIs.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.services import cache_service, project_service
from app.services.github_service import sync_public_repos, sync_readme
from app.services.leetcode_service import sync_leetcode_stats


async def run_full_sync() -> dict:
    """
    Purpose: Live-fetch all external portfolio data and warm caches.
    Output:  summary dict with counts, timestamps, and per-source status.
    """
    result: dict = {
        "ok": True,
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "sources": {},
    }

    # --- GitHub repos ---
    try:
        repos = await sync_public_repos()
        result["sources"]["github_repos"] = {"ok": True, "count": len(repos)}
    except Exception as exc:
        result["ok"] = False
        result["sources"]["github_repos"] = {"ok": False, "error": str(exc)}
        repos = await cache_service.cache_get(cache_service.KEY_GITHUB_REPOS) or []

    # --- LeetCode ---
    try:
        stats = await sync_leetcode_stats()
        result["sources"]["leetcode"] = {
            "ok": True,
            "username": stats.get("username"),
            "total_solved": stats.get("total_solved"),
            "current_rating": stats.get("current_rating"),
        }
    except Exception as exc:
        result["ok"] = False
        result["sources"]["leetcode"] = {"ok": False, "error": str(exc)}

    # --- READMEs for GitHub + curated project URLs ---
    urls: set[str] = set()
    if isinstance(repos, list):
        for repo in repos:
            if repo.get("github_url"):
                urls.add(repo["github_url"])
    try:
        curated = await project_service.list_projects()
        for project in curated:
            if project.get("github_url"):
                urls.add(project["github_url"])
    except Exception:
        pass

    readme_ok = 0
    readme_fail = 0
    for url in sorted(urls):
        try:
            data = await sync_readme(url)
            if data:
                readme_ok += 1
            else:
                readme_fail += 1
        except Exception:
            readme_fail += 1
    result["sources"]["github_readmes"] = {
        "ok": True,
        "synced": readme_ok,
        "missing": readme_fail,
        "attempted": len(urls),
    }

    # --- Merged public projects list ---
    try:
        merged = await project_service.rebuild_merged_projects_cache()
        result["sources"]["merged_projects"] = {"ok": True, "count": len(merged)}
    except Exception as exc:
        result["ok"] = False
        result["sources"]["merged_projects"] = {"ok": False, "error": str(exc)}

    await cache_service.cache_set(
        cache_service.KEY_SYNC_META,
        {
            "last_synced_at": result["synced_at"],
            "ok": result["ok"],
            "sources": result["sources"],
        },
    )
    return result
