/**
 * usePageAnalytics hook.
 *
 * Purpose: On each public route change, ensure a per-tab session id and record
 *          a page_view event. Skips /admin.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { prefetchGeoOnce, trackEvent } from "@/api/analytics";

const SESSION_KEY = "portfolio_analytics_sid";

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export function usePageAnalytics(): void {
  const location = useLocation();

  // Start the one-time geo lookup early; failures are ignored.
  useEffect(() => {
    prefetchGeoOnce();
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/admin")) return;

    void trackEvent({
      event_type: "page_view",
      path,
      session_id: getOrCreateSessionId(),
    });
  }, [location.pathname]);
}
