"""
Structured application logger.

Format:
    [YYYY-MM-DD HH:MM:SS] [Module Name] [function/API Route]
    [2026-07-25 16:30:45] [Profile] [/GET Profile]

Uses the standard library logging module so lines show up in the uvicorn
console (print() is often buffered / hidden under --reload on Windows).
"""

from __future__ import annotations

import functools
import logging
import sys
import traceback
from collections.abc import Callable
from datetime import datetime
from typing import Any, ParamSpec, TypeVar

from fastapi import HTTPException

P = ParamSpec("P")
R = TypeVar("R")

# Dedicated logger — force a stderr handler so output always reaches the
# terminal even if the root logger is misconfigured.
_logger = logging.getLogger("portfolio")
_logger.setLevel(logging.INFO)
_logger.propagate = False

if not _logger.handlers:
    _handler = logging.StreamHandler(sys.stderr)
    _handler.setLevel(logging.INFO)
    _handler.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(_handler)


def _timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(module: str, action: str, detail: str = "") -> None:
    """
    Purpose: Emit one structured log line to the backend console.
    Inputs:  module (e.g. "Profile"), action (e.g. "/GET Profile"), optional detail.
    Output:  None.
    """
    line = f"[{_timestamp()}] [{module}] [{action}]"
    if detail:
        line = f"{line} {detail}"
    # StreamHandler(sys.stderr) — uvicorn always surfaces stderr in the console.
    _logger.info(line)


def log_error(module: str, action: str, exc: BaseException) -> None:
    """Log an exception with traceback under the same structured format."""
    log(module, action, f"ERROR: {type(exc).__name__}: {exc}")
    traceback.print_exc(file=sys.stderr)


def logged(module: str, action: str | None = None) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """
    Purpose: Wrap a sync/async function with entry/exit logging and try/catch.
    Inputs:  module name; action label (defaults to the function name).
    Output:  Decorated function that logs START / OK / ERROR.
    """

    def decorator(fn: Callable[P, R]) -> Callable[P, R]:
        label = action or fn.__name__

        if _is_coroutine(fn):

            @functools.wraps(fn)
            async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> Any:
                log(module, label, "START")
                try:
                    result = await fn(*args, **kwargs)  # type: ignore[misc]
                    log(module, label, "OK")
                    return result
                except HTTPException as exc:
                    log(module, label, f"HTTP {exc.status_code}: {exc.detail}")
                    raise
                except Exception as exc:
                    log_error(module, label, exc)
                    raise

            return async_wrapper  # type: ignore[return-value]

        @functools.wraps(fn)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            log(module, label, "START")
            try:
                result = fn(*args, **kwargs)
                log(module, label, "OK")
                return result
            except HTTPException as exc:
                log(module, label, f"HTTP {exc.status_code}: {exc.detail}")
                raise
            except Exception as exc:
                log_error(module, label, exc)
                raise

        return sync_wrapper

    return decorator


def _is_coroutine(fn: Callable[..., Any]) -> bool:
    import asyncio

    return asyncio.iscoroutinefunction(fn)
