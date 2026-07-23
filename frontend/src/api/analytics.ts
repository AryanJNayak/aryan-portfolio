/**
 * Analytics API client.
 *
 * Purpose: Fire-and-forget public event tracking + admin summary fetch.
 *          Geo (country/city) is optional: resolved at most once per tab session
 *          via free geojs.io. Failures never block or break the portfolio.
 */
import { apiClient } from "@/api/client";

export type AnalyticsEventType = "page_view" | "resume_download";
export type ResumeDownloadSource = "navbar" | "hero" | "resume";

export interface AnalyticsEventPayload {
  event_type: AnalyticsEventType;
  path?: string;
  session_id?: string;
  source?: ResumeDownloadSource;
  country?: string;
  city?: string;
  /** Client already attempted geo this session (skip server IP lookup). */
  geo_resolved?: boolean;
}

export interface AnalyticsSummary {
  page_views: number;
  unique_sessions: number;
  resume_downloads: number;
  top_countries: { name: string; count: number }[];
  top_cities: { name: string; count: number }[];
}

const GEO_CACHE_KEY = "portfolio_analytics_geo";
const GEO_DONE_KEY = "portfolio_analytics_geo_done";
const GEO_TIMEOUT_MS = 2000;

interface GeoInfo {
  country?: string;
  city?: string;
}

/** In-flight geo request — at most one network call per session. */
let geoInFlight: Promise<GeoInfo> | null = null;

function readCachedGeo(): GeoInfo {
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as GeoInfo;
  } catch {
    return {};
  }
}

function isGeoAttempted(): boolean {
  try {
    return sessionStorage.getItem(GEO_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function markGeoAttempted(geo: GeoInfo): void {
  try {
    sessionStorage.setItem(GEO_DONE_KEY, "1");
    if (geo.country || geo.city) {
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
    }
  } catch {
    // Private mode / blocked storage — ignore.
  }
}

/**
 * Purpose: Call free geojs.io at most once per session (success or fail).
 * Output:  Cached {country?, city?} — empty object if unavailable.
 */
function resolveVisitorGeoOnce(): Promise<GeoInfo> {
  if (isGeoAttempted()) {
    return Promise.resolve(readCachedGeo());
  }
  if (geoInFlight) return geoInFlight;

  geoInFlight = (async (): Promise<GeoInfo> => {
    const geo: GeoInfo = {};
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);

    try {
      const res = await fetch("https://get.geojs.io/v1/ip/geo.json", {
        method: "GET",
        credentials: "omit",
        signal: controller.signal,
      });
      if (res.ok) {
        const data = (await res.json()) as { country?: string; city?: string };
        if (data.country?.trim()) geo.country = data.country.trim().slice(0, 80);
        if (data.city?.trim()) geo.city = data.city.trim().slice(0, 80);
      }
    } catch {
      // Geo is optional — timeout, CORS, offline, etc. are fine.
    } finally {
      window.clearTimeout(timer);
      markGeoAttempted(geo);
      geoInFlight = null;
    }

    return geo;
  })();

  return geoInFlight;
}

/**
 * Purpose: Kick off the one-time geo lookup without awaiting (safe at app start).
 */
export function prefetchGeoOnce(): void {
  void resolveVisitorGeoOnce();
}

/**
 * Purpose: Record a tracking event. Never throws; never blocks the UI on geo.
 *          Uses cached geo when ready; starts one session lookup in the background.
 */
export async function trackEvent(payload: AnalyticsEventPayload): Promise<void> {
  try {
    // Prefer already-cached geo. Do not wait for network on every event.
    let geo = readCachedGeo();

    if (!isGeoAttempted()) {
      // First event in the session: wait briefly (once) so the first hit can include location.
      // If geo is slow/fails, we still post analytics with whatever we have.
      geo = await Promise.race([
        resolveVisitorGeoOnce(),
        new Promise<GeoInfo>((resolve) => {
          window.setTimeout(() => resolve(readCachedGeo()), GEO_TIMEOUT_MS);
        }),
      ]);
    }

    await apiClient.post("/api/analytics/event", {
      ...payload,
      country: payload.country ?? geo.country,
      city: payload.city ?? geo.city,
      // Tell the API we already tried (even if empty) so it won't IP-lookup again.
      geo_resolved: isGeoAttempted() || Boolean(geo.country || geo.city),
    });
  } catch {
    // Swallow — analytics/geo must never affect the visitor experience.
  }
}

/**
 * Purpose: Fetch all-time analytics totals (admin JWT required).
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await apiClient.get<AnalyticsSummary>("/api/analytics/summary");
  return data;
}

export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "custom";

export interface SeriesPoint {
  label: string;
  date: string;
  page_views: number;
  unique_sessions: number;
  resume_downloads: number;
}

export interface DayDetail {
  date: string;
  page_views: number;
  unique_sessions: number;
  resume_downloads: number;
  top_country: string | null;
  top_city: string | null;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface AnalyticsReport {
  period: AnalyticsPeriod;
  start: string;
  end: string;
  summary: AnalyticsSummary;
  series: SeriesPoint[];
  top_countries: NameCount[];
  top_cities: NameCount[];
  top_paths: NameCount[];
  top_sources: NameCount[];
  details: DayDetail[];
}

/**
 * Purpose: Fetch a date-scoped analytics report for the admin dashboard.
 */
export async function getAnalyticsReport(params: {
  period: AnalyticsPeriod;
  start?: string;
  end?: string;
}): Promise<AnalyticsReport> {
  const { data } = await apiClient.get<AnalyticsReport>("/api/analytics/report", {
    params: {
      period: params.period,
      start: params.start,
      end: params.end,
    },
  });
  return data;
}
