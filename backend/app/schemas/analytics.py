"""
Analytics event schemas.

Purpose:
    Validate public tracking events and admin report / summary responses.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

EventType = Literal["page_view", "resume_download"]
DownloadSource = Literal["navbar", "hero", "resume"]
ReportPeriod = Literal["daily", "weekly", "monthly", "custom"]


class AnalyticsEventCreate(BaseModel):
    """
    Purpose: Body for POST /api/analytics/event.
    Example: {"event_type": "page_view", "path": "/", "session_id": "abc",
              "country": "India", "city": "Ahmedabad"}
    """

    event_type: EventType
    path: str | None = Field(default=None, max_length=300)
    session_id: str | None = Field(default=None, max_length=80)
    source: DownloadSource | None = None
    country: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    geo_resolved: bool = False


class LocationCount(BaseModel):
    """Purpose: One named bucket (country, city, path, source)."""

    name: str
    count: int


class SeriesPoint(BaseModel):
    """Purpose: One time-bucket on the chart."""

    label: str
    date: str  # ISO date (start of bucket)
    page_views: int
    unique_sessions: int
    resume_downloads: int


class DayDetail(BaseModel):
    """Purpose: Per-day detail row for the selected range."""

    date: str
    page_views: int
    unique_sessions: int
    resume_downloads: int
    top_country: str | None = None
    top_city: str | None = None


class AnalyticsSummary(BaseModel):
    """Purpose: Totals (+ top locations) — used by legacy all-time endpoint."""

    page_views: int
    unique_sessions: int
    resume_downloads: int
    top_countries: list[LocationCount] = []
    top_cities: list[LocationCount] = []


class AnalyticsReport(BaseModel):
    """
    Purpose: Full admin analytics report for a date range.
    Includes summary, time series, breakdowns, and day-level details.
    """

    period: ReportPeriod
    start: datetime
    end: datetime
    summary: AnalyticsSummary
    series: list[SeriesPoint] = []
    top_countries: list[LocationCount] = []
    top_cities: list[LocationCount] = []
    top_paths: list[LocationCount] = []
    top_sources: list[LocationCount] = []
    details: list[DayDetail] = []
