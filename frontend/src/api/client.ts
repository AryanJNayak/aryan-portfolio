/**
 * Axios HTTP client.
 *
 * Purpose: Central axios instance for all API calls. Automatically attaches the
 *          admin JWT (if present) and points at the backend base URL.
 *          Request/response console logging runs in development only.
 *
 * Example:
 *   import { apiClient } from "@/api/client";
 *   const { data } = await apiClient.get("/api/profile");
 */
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import { log, logError } from "@/lib/log";

const TOKEN_KEY = "portfolio_admin_token";

/** False in production builds — API path/timing logs must never ship to visitors. */
const IS_DEV = import.meta.env.DEV;

type TimedConfig = InternalAxiosRequestConfig & { metadata?: { startedAt: number } };

/** Shared axios instance. Empty baseURL -> uses the Vite proxy for /api in dev. */
export const apiClient = axios.create({
  // Leave blank in local dev so requests go to the Vite server and get proxied
  // to http://localhost:8000. Set VITE_API_BASE_URL for production.
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: { "Content-Type": "application/json" },
});

/**
 * Purpose: Read the stored admin token.
 * Output:  string token or null.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Purpose: Persist (or clear) the admin token.
 * Inputs:  token (string) to save, or null to log out.
 */
export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function requestAction(config: Pick<AxiosRequestConfig, "method" | "url">): string {
  const method = (config.method || "get").toUpperCase();
  const url = config.url || "/";
  return `${method} ${url}`;
}

// Always attach the bearer token (needed in production).
apiClient.interceptors.request.use(
  (config: TimedConfig) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Dev-only: log outgoing requests + stash timing.
    if (IS_DEV) {
      log("API", requestAction(config), "→ server request");
      config.metadata = { startedAt: performance.now() };
    }
    return config;
  },
  (error) => {
    if (IS_DEV) logError("API", "request_interceptor", error);
    return Promise.reject(error);
  },
);

// Dev-only response logging — not registered in production builds.
if (IS_DEV) {
  apiClient.interceptors.response.use(
    (response) => {
      try {
        const config = response.config as TimedConfig;
        const action = requestAction(config);
        const startedAt = config.metadata?.startedAt;
        const ms = startedAt != null ? Math.round(performance.now() - startedAt) : "?";
        log("API", action, `← ${response.status} (${ms}ms)`);
      } catch (error) {
        logError("API", "response_interceptor", error);
      }
      return response;
    },
    (error) => {
      try {
        const config = error.config as TimedConfig | undefined;
        const action = config ? requestAction(config) : "UNKNOWN";
        const status = error.response?.status ?? "NETWORK";
        const startedAt = config?.metadata?.startedAt;
        const ms = startedAt != null ? Math.round(performance.now() - startedAt) : "?";
        logError("API", action, `${status} (${ms}ms) — ${error.message}`);
      } catch (logErr) {
        logError("API", "response_interceptor", logErr);
      }
      return Promise.reject(error);
    },
  );
}
