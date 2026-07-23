/**
 * useProfile hook.
 *
 * Purpose: Fetch the profile once and expose loading state. Falls back to
 *          bundled data if the API is unreachable so the site still renders.
 *
 * Output:  { profile, loading }.
 */
import { useEffect, useState } from "react";

import { getProfile } from "@/api/profile";
import { FALLBACK_PROFILE } from "@/lib/fallback";
import type { Profile } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(FALLBACK_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((data) => active && setProfile(data))
      .catch(() => active && setProfile(FALLBACK_PROFILE))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { profile, loading };
}
