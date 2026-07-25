"""
Authentication dependency (route guard).

Purpose:
    Protect admin-only routes. FastAPI runs `require_admin` before the endpoint;
    if the bearer token is missing/invalid it raises 401 and the endpoint never runs.

Inputs:
    Authorization header: "Bearer <jwt>".

Output:
    The admin's email (str) extracted from the token, injected into the route.

Example:
    @router.post("/projects", dependencies=[Depends(require_admin)])
    async def create(...): ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.utils.logger import log
from app.utils.security import decode_access_token

# `auto_error=False` lets us return a clean 401 with our own message.
_bearer_scheme = HTTPBearer(auto_error=False)


async def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """
    Purpose: Verify the request carries a valid admin JWT.
    Inputs:  credentials - parsed Authorization header (may be None).
    Output:  str - the admin email (the token's `sub` claim).
    Raises:  HTTPException 401 if token is absent/invalid.
    """
    try:
        log("AuthMiddleware", "require_admin", "START")
        if credentials is None or not credentials.credentials:
            log("AuthMiddleware", "require_admin", "HTTP 401: Missing authentication token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authentication token",
            )

        payload = decode_access_token(credentials.credentials)
        if payload is None or "sub" not in payload:
            log("AuthMiddleware", "require_admin", "HTTP 401: Invalid or expired token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        log("AuthMiddleware", "require_admin", "OK")
        return payload["sub"]
    except HTTPException:
        raise
    except Exception as exc:
        log("AuthMiddleware", "require_admin", f"ERROR: {exc}")
        raise
