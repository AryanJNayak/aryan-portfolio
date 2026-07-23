/**
 * Profile API calls.
 *
 * Purpose: Fetch the static profile data (bio, experience, education, skills).
 */
import { apiClient } from "@/api/client";
import type { Profile } from "@/types";

/**
 * Purpose: Get the full profile object.
 * Inputs:  none.
 * Output:  Promise<Profile>.
 * Example: const profile = await getProfile();
 */
export async function getProfile(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>("/api/profile");
  return data;
}
