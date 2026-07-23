"""
Project service.

Purpose:
    CRUD for manually-curated projects stored in MongoDB, plus a merge helper
    that combines curated projects with cached GitHub repos for the public
    Projects section. External APIs are never called here — only admin sync
    refreshes GitHub data.
"""

from datetime import datetime, timezone

from bson import ObjectId

from app.database import get_projects_collection
from app.services import cache_service
from app.services.github_service import get_cached_repos


def _serialize(doc: dict) -> dict:
    """
    Purpose: Convert a MongoDB document to a JSON-friendly dict.
    Inputs:  doc (dict) - raw Mongo document with ObjectId `_id`.
    Output:  dict with string `id` (and `_id` removed).
    """
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    doc.setdefault("source", "manual")
    return doc


async def list_projects() -> list[dict]:
    """
    Purpose: Return all admin-curated projects, sorted by order then recency.
    Output:  list[dict] (ProjectResponse shape).
    """
    try:
        cursor = get_projects_collection().find().sort([("order", 1), ("created_at", -1)])
        return [_serialize(d) async for d in cursor]
    except Exception:
        return []


async def get_project(project_id: str) -> dict | None:
    """Purpose: Fetch a single curated project by id."""
    if not ObjectId.is_valid(project_id):
        return None
    doc = await get_projects_collection().find_one({"_id": ObjectId(project_id)})
    return _serialize(doc) if doc else None


async def create_project(data: dict) -> dict:
    """Purpose: Insert a new curated project and refresh the public merge cache."""
    now = datetime.now(timezone.utc)
    data = {**data, "source": "manual", "created_at": now, "updated_at": now}
    result = await get_projects_collection().insert_one(data)
    created = _serialize({**data, "_id": result.inserted_id})
    await rebuild_merged_projects_cache()
    return created


async def update_project(project_id: str, data: dict) -> dict | None:
    """Purpose: Patch an existing project and refresh the public merge cache."""
    if not ObjectId.is_valid(project_id):
        return None
    clean = {k: v for k, v in data.items() if v is not None}
    clean["updated_at"] = datetime.now(timezone.utc)
    await get_projects_collection().update_one(
        {"_id": ObjectId(project_id)}, {"$set": clean}
    )
    updated = await get_project(project_id)
    await rebuild_merged_projects_cache()
    return updated


async def delete_project(project_id: str) -> bool:
    """Purpose: Delete a project and refresh the public merge cache."""
    if not ObjectId.is_valid(project_id):
        return False
    result = await get_projects_collection().delete_one({"_id": ObjectId(project_id)})
    ok = result.deleted_count == 1
    if ok:
        await rebuild_merged_projects_cache()
    return ok


def _github_as_project(repo: dict) -> dict:
    """Purpose: Map a cached GitHub repo into the public ProjectResponse shape."""
    return {
        "id": f"gh_{repo['name']}",
        "title": repo["name"],
        "description": repo["description"],
        "content_html": "",
        "tech": ([repo["language"]] if repo["language"] else []) + repo.get("topics", []),
        "github_url": repo["github_url"],
        "demo_url": repo["demo_url"],
        "thumbnail": None,
        "images": [],
        "video_url": None,
        "featured": False,
        "order": 999,
        "source": "github",
        "stars": repo["stars"],
        "language": repo["language"],
        "created_at": repo["created_at"],
        "updated_at": repo["updated_at"],
    }


async def build_merged_projects() -> list[dict]:
    """
    Purpose: Build curated + cached-GitHub list (no live API calls).
    Output:  list[dict] ProjectResponse shape.
    """
    curated = await list_projects()
    curated_urls = {p.get("github_url") for p in curated if p.get("github_url")}

    repos = await get_cached_repos()
    github_projects = [
        _github_as_project(repo)
        for repo in repos
        if repo.get("github_url") not in curated_urls
    ]
    return curated + github_projects


async def rebuild_merged_projects_cache() -> list[dict]:
    """Purpose: Recompute merged list and write Mongo + Redis."""
    merged = await build_merged_projects()
    await cache_service.cache_set(cache_service.KEY_MERGED_PROJECTS, merged)
    return merged


async def list_merged_projects() -> list[dict]:
    """
    Purpose: Public projects list from Redis → Mongo, rebuilding from local
             data only if the merge cache is cold (still no GitHub live call).
    """
    cached = await cache_service.cache_get(cache_service.KEY_MERGED_PROJECTS)
    if isinstance(cached, list):
        return cached
    return await rebuild_merged_projects_cache()


async def get_public_project(project_id: str) -> dict | None:
    """Purpose: Fetch one public project by merged-list id."""
    for project in await list_merged_projects():
        if project.get("id") == project_id:
            return project
    return None
