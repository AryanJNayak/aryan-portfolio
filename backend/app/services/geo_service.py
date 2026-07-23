"""
IP geolocation helper.

Purpose:
    Resolve a visitor IP to approximate country/city for analytics.
    Tries multiple free providers; IPv6 is URL-encoded. IPs are never persisted.
"""

from __future__ import annotations

import ipaddress
import time
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import Request

# In-memory cache: IP -> (expires_at, country, city).
_CACHE: dict[str, tuple[float, str | None, str | None]] = {}
_CACHE_TTL_SEC = 60 * 60 * 6
_CACHE_MAX = 2000


def client_ip(request: Request) -> str | None:
    """Best-effort public client IP from proxy headers or the socket."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        candidate = forwarded.split(",")[0].strip()
        if candidate:
            return candidate

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    # Render / some proxies also send this.
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf.strip()

    if request.client and request.client.host:
        return request.client.host
    return None


def _is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return not (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_reserved
        or addr.is_multicast
    )


def _clean(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text or text.lower() in {"null", "undefined", "n/a", "-"}:
        return None
    return text[:80]


def _cache_get(ip: str) -> tuple[str | None, str | None] | None:
    entry = _CACHE.get(ip)
    if not entry:
        return None
    expires_at, country, city = entry
    if time.time() > expires_at:
        _CACHE.pop(ip, None)
        return None
    return country, city


def _cache_set(ip: str, country: str | None, city: str | None) -> None:
    if len(_CACHE) >= _CACHE_MAX:
        _CACHE.pop(next(iter(_CACHE)), None)
    _CACHE[ip] = (time.time() + _CACHE_TTL_SEC, country, city)


async def _from_geojs(client: httpx.AsyncClient, ip: str) -> tuple[str | None, str | None]:
    # Free, HTTPS, no key. Encode IP so IPv6 colons don't break the path.
    encoded = quote(ip, safe="")
    resp = await client.get(f"https://get.geojs.io/v1/ip/geo/{encoded}.json")
    if resp.status_code != 200:
        return None, None
    data = resp.json()
    return _clean(data.get("country")), _clean(data.get("city"))


async def _from_ipwho(client: httpx.AsyncClient, ip: str) -> tuple[str | None, str | None]:
    encoded = quote(ip, safe="")
    resp = await client.get(f"https://ipwho.is/{encoded}")
    if resp.status_code != 200:
        return None, None
    data: dict[str, Any] = resp.json()
    if not data.get("success", True):
        return None, None
    return _clean(data.get("country")), _clean(data.get("city"))


async def _from_ipapi(client: httpx.AsyncClient, ip: str) -> tuple[str | None, str | None]:
    # Free tier is HTTP-only (no key). Fine for server-side outbound.
    resp = await client.get(
        f"http://ip-api.com/json/{quote(ip, safe='')}?fields=status,country,city"
    )
    if resp.status_code != 200:
        return None, None
    data = resp.json()
    if data.get("status") != "success":
        return None, None
    return _clean(data.get("country")), _clean(data.get("city"))


async def lookup_geo(ip: str | None) -> dict[str, str | None]:
    """
    Purpose: Map an IP to {country, city} via free providers (geojs → ipwho → ip-api).
    """
    empty = {"country": None, "city": None}
    if not ip or not _is_public_ip(ip):
        return empty

    cached = _cache_get(ip)
    if cached is not None:
        return {"country": cached[0], "city": cached[1]}

    country: str | None = None
    city: str | None = None
    providers = (_from_geojs, _from_ipwho, _from_ipapi)

    try:
        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
            for provider in providers:
                try:
                    country, city = await provider(client, ip)
                except Exception:
                    country, city = None, None
                if country or city:
                    break
    except Exception:
        pass

    _cache_set(ip, country, city)
    return {"country": country, "city": city}


async def geo_from_request(request: Request) -> dict[str, str | None]:
    """Purpose: Resolve country/city for the current request's client IP."""
    return await lookup_geo(client_ip(request))
