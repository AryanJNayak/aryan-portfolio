"""
Project routes.

Base path: /api/projects
Purpose:   Public read access to the merged (curated + GitHub) project list, plus
           admin-only create/update/delete for curated projects.
"""

from fastapi import APIRouter, Depends, HTTPException

from app.middlewares.auth_middleware import require_admin
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("")
async def get_projects() -> list[dict]:
    """
    Route:   GET /api/projects
    Purpose: Public list = curated projects + public GitHub repos (deduped).
    Inputs:  none.
    Output:  list of ProjectResponse objects.
    Example: GET /api/projects
    """
    return await project_service.list_merged_projects()


@router.get("/curated", dependencies=[Depends(require_admin)])
async def get_curated_projects() -> list[dict]:
    """
    Route:   GET /api/projects/curated  (admin only)
    Purpose: List only the admin-created projects (for the editor dashboard).
    Output:  list of ProjectResponse objects.
    """
    return await project_service.list_projects()


@router.get("/count")
async def get_project_count() -> dict:
    """
    Route:   GET /api/projects/count
    Purpose: Provide the total number of projects for the animated stat counter.
    Output:  {count: int}.
    """
    merged = await project_service.list_merged_projects()
    return {"count": len(merged)}


@router.get("/{project_id}")
async def get_project_detail(project_id: str) -> dict:
    """
    Route:   GET /api/projects/{project_id}
    Purpose: Public single-project detail (curated or GitHub) for the detail page.
    Inputs:  path project_id (public id from the merged list).
    Output:  ProjectResponse; 404 if not found.
    """
    project = await project_service.get_public_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", status_code=201, dependencies=[Depends(require_admin)])
async def create_project(body: ProjectCreate) -> dict:
    """
    Route:   POST /api/projects  (admin only)
    Purpose: Create a new curated project (with rich HTML content + media).
    Inputs:  JSON body (ProjectCreate); Authorization header.
    Output:  the created ProjectResponse.
    """
    return await project_service.create_project(body.model_dump())


@router.put("/{project_id}", dependencies=[Depends(require_admin)])
async def update_project(project_id: str, body: ProjectUpdate) -> dict:
    """
    Route:   PUT /api/projects/{project_id}  (admin only)
    Purpose: Update fields of an existing curated project.
    Inputs:  path project_id; JSON body (ProjectUpdate).
    Output:  the updated ProjectResponse; 404 if not found.
    """
    updated = await project_service.update_project(project_id, body.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated


@router.delete("/{project_id}", dependencies=[Depends(require_admin)])
async def delete_project(project_id: str) -> dict:
    """
    Route:   DELETE /api/projects/{project_id}  (admin only)
    Purpose: Remove a curated project.
    Inputs:  path project_id; Authorization header.
    Output:  {success: true}; 404 if not found.
    """
    ok = await project_service.delete_project(project_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True}
