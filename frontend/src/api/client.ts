/**
 * Axios HTTP client.
 *
 * Purpose: Central axios instance for all API calls. Automatically attaches the
 *          admin JWT (if present) and points at the backend base URL.
 *
 * Example:
 *   import { apiClient } from "@/api/client";
 *   const { data } = await apiClient.get("/api/profile");
 */
import axios from "axios";

const TOKEN_KEY = "portfolio_admin_token";

/** Shared axios instance. Empty baseURL -> uses the Vite dev proxy for /api. */
export const apiClient = axios.create({
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

// Attach the bearer token to every outgoing request when available.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
