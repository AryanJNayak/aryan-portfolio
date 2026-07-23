/**
 * Auth API calls.
 *
 * Purpose: Admin login/logout and token verification.
 */
import { apiClient, setToken } from "@/api/client";
import type { LoginForm } from "@/types/forms";
import type { TokenResponse } from "@/types";

/**
 * Purpose: Log the admin in and persist the returned JWT.
 * Inputs:  form (LoginForm) {email, password}.
 * Output:  Promise<void> - throws on invalid credentials (401).
 * Example: await login({ email, password });
 */
export async function login(form: LoginForm): Promise<void> {
  const { data } = await apiClient.post<TokenResponse>("/api/auth/login", form);
  setToken(data.access_token);
}

/**
 * Purpose: Clear the stored token (log out).
 * Output:  void.
 */
export function logout(): void {
  setToken(null);
}

/**
 * Purpose: Check whether the stored token is still valid.
 * Output:  Promise<boolean> - true if authenticated.
 */
export async function verifyAuth(): Promise<boolean> {
  try {
    await apiClient.get("/api/auth/me");
    return true;
  } catch {
    return false;
  }
}
