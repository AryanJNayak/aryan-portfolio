"""
Analytics routes.

Base path: /api/analytics
Purpose:   Accept public tracking events and expose admin reports
           (summary + date-wise chart data, breakdowns, details).
"""

from typing import Literal

from fastapi import APIRouter, Depends, Query, Request

from app.middlewares.auth_middleware import require_admin
from app.schemas.analytics import AnalyticsEventCreate, AnalyticsReport, AnalyticsSummary
from app.services import analytics_service
from app.services.geo_service import geo_from_request

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

Period = Literal["daily", "weekly", "monthly", "custom"]


def _clean_loc(value: str | None) -> str | None:
    if not value:
        return None
    text = value.strip()
    if not text or text.lower() in {"null", "undefined", "n/a", "-"}:
        return None
    return text[:80]


@router.post("/event", status_code=201)
async def create_event(body: AnalyticsEventCreate, request: Request) -> dict:
    """
    Route:   POST /api/analytics/event
    Purpose: Record a page view or resume download with optional country/city.
    """
    country = _clean_loc(body.country)
    city = _clean_loc(body.city)

    if not body.geo_resolved and not country and not city:
        geo = await geo_from_request(request)
        country = geo.get("country")
        city = geo.get("city")

    await analytics_service.record_event(
        body.event_type,
        path=body.path,
        session_id=body.session_id,
        source=body.source,
        country=country,
        city=city,
    )
    return {"success": True}


@router.get("/summary", response_model=AnalyticsSummary)
async def analytics_summary(_admin: str = Depends(require_admin)) -> AnalyticsSummary:
    """
    Route:   GET /api/analytics/summary
    Purpose: All-time totals (kept for compatibility).
    """
    data = await analytics_service.get_summary()
    return AnalyticsSummary(**data)


@router.get("/report", response_model=AnalyticsReport)
async def analytics_report(
    _admin: str = Depends(require_admin),
    period: Period = Query(default="daily"),
    start: str | None = Query(default=None, description="YYYY-MM-DD (custom)"),
    end: str | None = Query(default=None, description="YYYY-MM-DD (custom)"),
) -> AnalyticsReport:
    """
    Route:   GET /api/analytics/report
    Purpose: Date-scoped analytics — summary, series chart, breakdowns, details.
    Example: /api/analytics/report?period=weekly
             /api/analytics/report?period=custom&start=2026-07-01&end=2026-07-24
    """
    data = await analytics_service.get_report(period, start_date=start, end_date=end)
    return AnalyticsReport(**data)
