/**
 * LeetCode API calls.
 *
 * Purpose: Fetch the LeetCode mini-profile stats for the stats card.
 */
import { apiClient } from "@/api/client";
import type { LeetCodeStats } from "@/types";

/**
 * Purpose: Get LeetCode stats (rating, KPIs, top contests).
 * Output:  Promise<LeetCodeStats>.
 * Example: const stats = await getLeetCodeStats();
 */
export async function getLeetCodeStats(): Promise<LeetCodeStats> {
  const { data } = await apiClient.get<LeetCodeStats>("/api/leetcode/stats");
  return data;
}
