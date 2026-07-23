"""
Auth routes.

Base path: /api/auth
Purpose:   Let the single admin (you) log in and receive a JWT used to access
           the protected project/media endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.middlewares.auth_middleware import require_admin
from app.schemas.user import LoginRequest, TokenResponse
from app.services.auth_service import authenticate_admin

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    """
    Route:   POST /api/auth/login
    Purpose: Authenticate the admin and return an access token.
    Inputs:  JSON body {email, password}.
    Output:  {access_token, token_type} on success; 401 on bad credentials.
    Example: curl -X POST /api/auth/login -d '{"email":"..","password":".."}'
    """
    token = authenticate_admin(body.email, body.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return TokenResponse(access_token=token)


@router.get("/me")
async def me(admin_email: str = Depends(require_admin)) -> dict:
    """
    Route:   GET /api/auth/me
    Purpose: Verify a token is still valid (used by the admin UI on load).
    Inputs:  Authorization: Bearer <jwt>.
    Output:  {email} of the logged-in admin.
    """
    return {"email": admin_email}
