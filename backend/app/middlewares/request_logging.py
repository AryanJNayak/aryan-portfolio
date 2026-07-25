"""
HTTP request/response logging middleware (pure ASGI).

Purpose:
    Log every client → server request and the response status/duration using
    the shared structured logger format. Implemented as pure ASGI (not
    BaseHTTPMiddleware) so it always runs reliably under uvicorn.

Example:
    [2026-07-25 16:30:45] [HTTP] [GET /api/profile] ← client request
    [2026-07-25 16:30:45] [HTTP] [GET /api/profile] → 200 (12ms)
"""

from __future__ import annotations

import time
from typing import Callable

from app.utils.logger import log

# Paths that spam the console and are not useful for app debugging.
_SKIP_PATHS = {
    "/favicon.ico",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/docs/oauth2-redirect",
}


class RequestLoggingMiddleware:
    """ASGI middleware: log method, path, status, and elapsed ms."""

    def __init__(self, app: Callable) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if path in _SKIP_PATHS:
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "GET")
        query = scope.get("query_string", b"").decode("latin-1")
        action = f"{method} {path}"
        if query:
            action = f"{action}?{query}"

        log("HTTP", action, "← client request")
        started = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: dict) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 500)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - started) * 1000
            log(
                "HTTP",
                action,
                f"→ ERROR {type(exc).__name__}: {exc} ({elapsed_ms:.0f}ms)",
            )
            raise

        elapsed_ms = (time.perf_counter() - started) * 1000
        log("HTTP", action, f"→ {status_code} ({elapsed_ms:.0f}ms)")
