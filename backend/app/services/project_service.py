"""
Project service.

Purpose:
    CRUD for manually-curated projects stored in MongoDB, plus a "merge" helper
    that combines admin-curated projects with live GitHub repos for the public
    Projects section.

Output:
    dicts matching the ProjectResponse schema (with a string `id`).
"""

from datetime import datetime, timezone

from bson import ObjectId

from app.database import get_projects_collection
from app.services.github_service import fetch_public_repos


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
    Example: await list_projects()
    """
    try:
        cursor = get_projects_collection().find().sort([("order", 1), ("created_at", -1)])
        return [_serialize(d) async for d in cursor]
    except Exception:
        # If the DB is unreachable, still allow GitHub repos to show.
        return []


async def get_project(project_id: str) -> dict | None:
    """
    Purpose: Fetch a single project by id.
    Inputs:  project_id (str) - Mongo ObjectId as string.
    Output:  dict or None if not found / invalid id.
    """
    if not ObjectId.is_valid(project_id):
        return None
    doc = await get_projects_collection().find_one({"_id": ObjectId(project_id)})
    return _serialize(doc) if doc else None


async def create_project(data: dict) -> dict:
    """
    Purpose: Insert a new curated project.
    Inputs:  data (dict) - validated ProjectCreate fields.
    Output:  the created project (ProjectResponse shape).
    Example: await create_project({"title": "My App", ...})
    """
    now = datetime.now(timezone.utc)
    data = {**data, "source": "manual", "created_at": now, "updated_at": now}
    result = await get_projects_collection().insert_one(data)
    return _serialize({**data, "_id": result.inserted_id})


async def update_project(project_id: str, data: dict) -> dict | None:
    """
    Purpose: Patch an existing project (only provided fields).
    Inputs:  project_id (str), data (dict) - non-None ProjectUpdate fields.
    Output:  updated project dict, or None if not found.
    """
    if not ObjectId.is_valid(project_id):
        return None
    clean = {k: v for k, v in data.items() if v is not None}
    clean["updated_at"] = datetime.now(timezone.utc)
    await get_projects_collection().update_one(
        {"_id": ObjectId(project_id)}, {"$set": clean}
    )
    return await get_project(project_id)


async def delete_project(project_id: str) -> bool:
    """
    Purpose: Delete a project by id.
    Inputs:  project_id (str).
    Output:  True if a document was removed, else False.
    """
    if not ObjectId.is_valid(project_id):
        return False
    result = await get_projects_collection().delete_one({"_id": ObjectId(project_id)})
    return result.deleted_count == 1


async def list_merged_projects() -> list[dict]:
    """
    Purpose: Build the PUBLIC projects list = curated projects first, then any
             GitHub repos not already curated (matched by github_url).
    Output:  list[dict] (ProjectResponse shape) with GitHub items marked source="github".
    Example: await list_merged_projects()
    """
    curated = await list_projects()
    curated_urls = {p.get("github_url") for p in curated if p.get("github_url")}

    repos = await fetch_public_repos()
    github_projects = []
    for repo in repos:
        if repo["github_url"] in curated_urls:
            continue  # admin already enriched this one
        github_projects.append(
            {
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
        )

    return curated + github_projects


async def get_public_project(project_id: str) -> dict | None:
    """
    Purpose: Fetch a single project for the PUBLIC detail page by its public id.
             Works for both curated (Mongo id) and GitHub (``gh_<name>``) items.
    Inputs:  project_id (str) - the id as exposed by the merged list.
    Output:  dict (ProjectResponse shape) or None if not found.
    """
    for project in await list_merged_projects():
        if project.get("id") == project_id:
            return project
    return None
