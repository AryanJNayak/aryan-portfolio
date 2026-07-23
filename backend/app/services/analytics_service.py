"""
Analytics service.

Purpose:
    Persist public tracking events and build admin reports:
    summary, date-wise series, location/path breakdowns, and daily details.
    Raw IPs are never stored.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from app.database import get_analytics_collection

Period = Literal["daily", "weekly", "monthly", "custom"]


async def record_event(
    event_type: str,
    *,
    path: str | None = None,
    session_id: str | None = None,
    source: str | None = None,
    country: str | None = None,
    city: str | None = None,
) -> None:
    """Purpose: Insert one analytics event document."""
    if path and path.startswith("/admin"):
        return

    doc: dict = {
        "event_type": event_type,
        "created_at": datetime.now(timezone.utc),
    }
    if path:
        doc["path"] = path
    if session_id:
        doc["session_id"] = session_id
    if source:
        doc["source"] = source
    if country:
        doc["country"] = country
    if city:
        doc["city"] = city

    await get_analytics_collection().insert_one(doc)


def _parse_day(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        # Accept YYYY-MM-DD
        return datetime.strptime(value[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def resolve_range(
    period: Period,
    start_date: str | None = None,
    end_date: str | None = None,
) -> tuple[datetime, datetime, str]:
    """
    Purpose: Map period presets (or custom dates) to [start, end) UTC window
             and a Mongo dateTrunc unit for the chart series.
    Output:  (start, end_exclusive, bucket_unit) where bucket_unit is day|week|month.
    """
    now = datetime.now(timezone.utc)
    end = now
    unit = "day"

    if period == "daily":
        # Last 7 calendar days including today.
        start = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        unit = "day"
    elif period == "weekly":
        # Last 8 weeks.
        start = (now - timedelta(days=7 * 7)).replace(hour=0, minute=0, second=0, microsecond=0)
        unit = "week"
    elif period == "monthly":
        # Last 12 months (approx).
        start = (now - timedelta(days=365)).replace(hour=0, minute=0, second=0, microsecond=0)
        unit = "month"
    else:
        # custom
        start = _parse_day(start_date) or (now - timedelta(days=6)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_day = _parse_day(end_date) or now.replace(hour=0, minute=0, second=0, microsecond=0)
        # Inclusive end date → exclusive next midnight.
        end = end_day + timedelta(days=1)
        if end <= start:
            end = start + timedelta(days=1)
        span_days = max((end - start).days, 1)
        if span_days > 120:
            unit = "month"
        elif span_days > 31:
            unit = "week"
        else:
            unit = "day"

    return start, end, unit


def _match_range(start: datetime, end: datetime) -> dict:
    return {"created_at": {"$gte": start, "$lt": end}}


async def _top_field(
    field: str,
    *,
    match: dict,
    event_type: str | None = "page_view",
    limit: int = 8,
) -> list[dict]:
    col = get_analytics_collection()
    filt: dict[str, Any] = {
        **match,
        field: {"$exists": True, "$nin": [None, ""]},
    }
    if event_type:
        filt["event_type"] = event_type
    pipeline = [
        {"$match": filt},
        {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    rows = await col.aggregate(pipeline).to_list(limit)
    return [{"name": str(r["_id"]), "count": int(r["count"])} for r in rows if r.get("_id")]


async def _count_sessions(match: dict) -> int:
    col = get_analytics_collection()
    sessions = await col.distinct(
        "session_id",
        {
            **match,
            "event_type": "page_view",
            "session_id": {"$exists": True, "$nin": [None, ""]},
        },
    )
    return len(sessions)


def _label_for_bucket(dt: datetime, unit: str) -> str:
    if unit == "month":
        return dt.strftime("%b %Y")
    if unit == "week":
        return f"Week of {dt.strftime('%b %d')}"
    return dt.strftime("%b %d")


async def _series(start: datetime, end: datetime, unit: str) -> list[dict]:
    """Purpose: Build chart points bucketed by day/week/month."""
    col = get_analytics_collection()
    match = _match_range(start, end)

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "bucket": {
                        "$dateTrunc": {
                            "date": "$created_at",
                            "unit": unit,
                            "timezone": "UTC",
                        }
                    },
                    "event_type": "$event_type",
                },
                "count": {"$sum": 1},
                "sessions": {"$addToSet": "$session_id"},
            }
        },
        {"$sort": {"_id.bucket": 1}},
    ]

    rows = await col.aggregate(pipeline).to_list(500)

    # Merge event types into one point per bucket.
    buckets: dict[datetime, dict] = {}
    for row in rows:
        bucket = row["_id"]["bucket"]
        if isinstance(bucket, datetime) and bucket.tzinfo is None:
            bucket = bucket.replace(tzinfo=timezone.utc)
        et = row["_id"].get("event_type")
        point = buckets.setdefault(
            bucket,
            {
                "date": bucket.date().isoformat(),
                "label": _label_for_bucket(bucket, unit),
                "page_views": 0,
                "unique_sessions": 0,
                "resume_downloads": 0,
                "_session_ids": set(),
            },
        )
        if et == "page_view":
            point["page_views"] += int(row["count"])
            for sid in row.get("sessions") or []:
                if sid:
                    point["_session_ids"].add(sid)
        elif et == "resume_download":
            point["resume_downloads"] += int(row["count"])

    series: list[dict] = []
    for bucket in sorted(buckets.keys()):
        point = buckets[bucket]
        point["unique_sessions"] = len(point.pop("_session_ids"))
        series.append(point)
    return series


async def _daily_details(start: datetime, end: datetime) -> list[dict]:
    """Purpose: One detail row per calendar day in the range."""
    col = get_analytics_collection()
    match = _match_range(start, end)

    pipeline = [
        {"$match": match},
        {
            "$group": {
                "_id": {
                    "day": {
                        "$dateTrunc": {
                            "date": "$created_at",
                            "unit": "day",
                            "timezone": "UTC",
                        }
                    },
                    "event_type": "$event_type",
                },
                "count": {"$sum": 1},
                "sessions": {"$addToSet": "$session_id"},
                "countries": {"$push": "$country"},
                "cities": {"$push": "$city"},
            }
        },
        {"$sort": {"_id.day": -1}},
    ]
    rows = await col.aggregate(pipeline).to_list(1000)

    days: dict[str, dict] = {}
    for row in rows:
        day_dt = row["_id"]["day"]
        if isinstance(day_dt, datetime):
            key = day_dt.date().isoformat()
        else:
            key = str(day_dt)[:10]
        entry = days.setdefault(
            key,
            {
                "date": key,
                "page_views": 0,
                "unique_sessions": 0,
                "resume_downloads": 0,
                "_session_ids": set(),
                "_countries": {},
                "_cities": {},
            },
        )
        et = row["_id"].get("event_type")
        if et == "page_view":
            entry["page_views"] += int(row["count"])
            for sid in row.get("sessions") or []:
                if sid:
                    entry["_session_ids"].add(sid)
            for c in row.get("countries") or []:
                if c:
                    entry["_countries"][c] = entry["_countries"].get(c, 0) + 1
            for c in row.get("cities") or []:
                if c:
                    entry["_cities"][c] = entry["_cities"].get(c, 0) + 1
        elif et == "resume_download":
            entry["resume_downloads"] += int(row["count"])

    details: list[dict] = []
    for key in sorted(days.keys(), reverse=True):
        d = days[key]
        d["unique_sessions"] = len(d.pop("_session_ids"))
        countries = d.pop("_countries")
        cities = d.pop("_cities")
        d["top_country"] = max(countries, key=countries.get) if countries else None
        d["top_city"] = max(cities, key=cities.get) if cities else None
        details.append(d)
    return details


async def get_summary(
    *,
    start: datetime | None = None,
    end: datetime | None = None,
) -> dict:
    """Purpose: Totals + top locations (optionally scoped to a date range)."""
    col = get_analytics_collection()
    match: dict = {}
    if start is not None and end is not None:
        match = _match_range(start, end)

    page_filter = {**match, "event_type": "page_view"}
    dl_filter = {**match, "event_type": "resume_download"}

    page_views = await col.count_documents(page_filter)
    resume_downloads = await col.count_documents(dl_filter)
    unique_sessions = await _count_sessions(match)

    top_countries = await _top_field("country", match=match)
    top_cities = await _top_field("city", match=match)

    return {
        "page_views": page_views,
        "unique_sessions": unique_sessions,
        "resume_downloads": resume_downloads,
        "top_countries": top_countries,
        "top_cities": top_cities,
    }


async def get_report(
    period: Period,
    *,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict:
    """
    Purpose: Full analytics report for admin — summary, chart series,
             breakdowns, and day-level details for the selected range.
    """
    start, end, unit = resolve_range(period, start_date, end_date)
    match = _match_range(start, end)

    summary = await get_summary(start=start, end=end)
    series = await _series(start, end, unit)
    details = await _daily_details(start, end)

    top_paths = await _top_field("path", match=match, event_type="page_view", limit=10)
    top_sources = await _top_field(
        "source", match=match, event_type="resume_download", limit=5
    )

    return {
        "period": period,
        "start": start,
        "end": end,
        "summary": summary,
        "series": series,
        "top_countries": summary["top_countries"],
        "top_cities": summary["top_cities"],
        "top_paths": top_paths,
        "top_sources": top_sources,
        "details": details,
    }
