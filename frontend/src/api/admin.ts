/**
 * Admin API calls.
 *
 * Purpose: Sync official GitHub / LeetCode data into MongoDB + Redis,
 *          and benchmark Redis vs Mongo read latency.
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

export type CacheKeyBenchmark = {
  redis_hit: boolean;
  mongo_hit: boolean;
  redis_ms: number[];
  mongo_ms: number[];
  redis_avg_ms: number | null;
  mongo_avg_ms: number | null;
  speedup: number | null;
};

export type CacheBenchmarkResult = {
  rounds: number;
  redis_configured: boolean;
  keys: Record<string, CacheKeyBenchmark>;
  summary: {
    redis_avg_ms: number | null;
    mongo_avg_ms: number | null;
    speedup: number | null;
    note: string;
  };
  /** Client-measured round-trip for this benchmark API call (ms). */
  client_roundtrip_ms?: number;
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

/**
 * Purpose: Compare Redis vs MongoDB read times (server-side) and measure
 *          client round-trip with performance.now().
 * Output:  Promise<CacheBenchmarkResult>
 */
export async function runCacheBenchmark(rounds = 5): Promise<CacheBenchmarkResult> {
  const t0 = performance.now();
  const { data } = await apiClient.get<CacheBenchmarkResult>("/api/admin/cache-benchmark", {
    params: { rounds },
  });
  const client_roundtrip_ms = Math.round((performance.now() - t0) * 10) / 10;
  return { ...data, client_roundtrip_ms };
}
