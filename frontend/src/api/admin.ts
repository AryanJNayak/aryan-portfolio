/**
 * Admin API calls.
 *
 * Purpose: Sync official GitHub / LeetCode data into MongoDB + Redis.
 */
import { apiClient } from "@/api/client";

export type SyncSourceResult = {
  ok: boolean;
  count?: number;
  synced?: number;
  missing?: number;
  attempted?: number;
  username?: string;
  total_solved?: number;
  current_rating?: number;
  error?: string;
};

export type SyncResult = {
  ok: boolean;
  synced_at: string;
  sources: Record<string, SyncSourceResult>;
};

export type SyncStatus = {
  last_synced_at: string | null;
  ok?: boolean;
  sources?: Record<string, SyncSourceResult>;
};

/**
 * Purpose: Trigger a full live sync (admin JWT required).
 * Output:  Promise<SyncResult>
 */
export async function syncPortfolioData(): Promise<SyncResult> {
  const { data } = await apiClient.post<SyncResult>("/api/admin/sync");
  return data;
}

/**
 * Purpose: Read last sync metadata.
 * Output:  Promise<SyncStatus>
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const { data } = await apiClient.get<SyncStatus>("/api/admin/sync/status");
  return data;
}
