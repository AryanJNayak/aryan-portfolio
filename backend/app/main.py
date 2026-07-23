"""
FastAPI application entry point.

Purpose:
    Create the app, configure CORS, register all routers, and expose a health
    check. Run with:  uvicorn app.main:app --reload

Output:
    An ASGI `app` object served by uvicorn.

Example:
    uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import ping
from app.routes import auth, contact, github, leetcode, media, profile, projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Purpose: Startup/shutdown hook. Verifies the MongoDB connection on boot.
    Inputs:  the FastAPI app.
    Output:  yields control to the running server.
    """
    try:
        await ping()
        print("[startup] Connected to MongoDB Atlas.")
    except Exception as exc:  # pragma: no cover - surfaced in logs only
        print(f"[startup] WARNING: MongoDB ping failed: {exc}")
    yield


app = FastAPI(
    title="Aryan Nayak - Portfolio API",
    description="Backend for the portfolio site: projects, GitHub, LeetCode, media, auth.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server (and configured origins) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register resource routers.
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(projects.router)
app.include_router(github.router)
app.include_router(leetcode.router)
app.include_router(media.router)
app.include_router(contact.router)


@app.get("/", tags=["health"])
async def root() -> dict:
    """
    Route:   GET /
    Purpose: Simple liveness/info endpoint.
    Output:  {status, service, docs} pointing to the interactive docs.
    """
    return {"status": "ok", "service": "portfolio-api", "docs": "/docs"}


@app.get("/api/health", tags=["health"])
async def health() -> dict:
    """
    Route:   GET /api/health
    Purpose: Report API + database health for monitoring.
    Output:  {api: "ok", database: "ok"|"error"}.
    """
    try:
        await ping()
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"api": "ok", "database": db_status}

