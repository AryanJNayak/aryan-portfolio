"""
Project schemas.

Purpose:
    Define the shape of a portfolio project. Projects can be auto-imported from
    GitHub and then ENRICHED by the admin with images, a demo video, a demo link,
    and rich-text (HTML) content produced by the TipTap editor.

Example project payload:
    {
      "title": "Flipkart AI Assistant",
      "description": "LLM-based RAG product discovery.",
      "content_html": "<p><strong>Highlights</strong></p><ul>...</ul>",
      "tech": ["Python", "LangChain", "MongoDB"],
      "github_url": "https://github.com/AryanJNayak/FlipkartAssistant",
      "demo_url": "https://demo.example.com",
      "images": ["/api/media/<id>"],
      "video_url": "/api/media/<id>",
      "featured": true
    }
"""

from datetime import datetime

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Shared fields for creating/updating a project."""

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    content_html: str = Field(default="", description="Rich HTML from the editor")
    tech: list[str] = Field(default_factory=list)
    github_url: str | None = None
    demo_url: str | None = None
    thumbnail: str | None = Field(
        default=None, description="Cover image URL shown on the project card"
    )
    images: list[str] = Field(default_factory=list)
    video_url: str | None = None
    featured: bool = False
    order: int = Field(default=0, description="Manual sort order (lower = first)")


class ProjectCreate(ProjectBase):
    """
    Purpose: Body for POST /api/projects (admin only).
    Inputs:  all ProjectBase fields (title required).
    """


class ProjectUpdate(BaseModel):
    """
    Purpose: Body for PUT /api/projects/{id} (admin only). All fields optional
             so the admin can patch just one attribute.
    """

    title: str | None = None
    description: str | None = None
    content_html: str | None = None
    tech: list[str] | None = None
    github_url: str | None = None
    demo_url: str | None = None
    thumbnail: str | None = None
    images: list[str] | None = None
    video_url: str | None = None
    featured: bool | None = None
    order: int | None = None


class ProjectResponse(ProjectBase):
    """
    Purpose: Project as returned to the frontend.
    Output:  ProjectBase + id, source ("github"/"manual"), stars, language, dates.
    """

    id: str
    source: str = "manual"
    stars: int = 0
    language: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
