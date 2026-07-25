/**
 * Client-side structured logger (mirrors backend format).
 *
 * DEV ONLY — all methods are no-ops in production builds so API paths and
 * timing never leak into the browser console for visitors.
 *
 * Format:
 *   [YYYY-MM-DD HH:MM:SS] [Module Name] [function/API Route]
 *   [2026-07-25 16:30:45] [API] [GET /api/profile]
 */

/** True only during `vite` / `npm run dev`. False in production builds. */
const IS_DEV = import.meta.env.DEV;

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * Purpose: Print one structured log line to the browser console (dev only).
 * Inputs:  module (e.g. "API"), action (e.g. "GET /api/profile"), optional detail.
 */
export function log(module: string, action: string, detail = ""): void {
  if (!IS_DEV) return;
  const line = detail
    ? `[${timestamp()}] [${module}] [${action}] ${detail}`
    : `[${timestamp()}] [${module}] [${action}]`;
  console.log(line);
}

/**
 * Purpose: Log an error in the same structured format (dev only).
 */
export function logError(module: string, action: string, error: unknown): void {
  if (!IS_DEV) return;
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${timestamp()}] [${module}] [${action}] ERROR: ${message}`);
}
