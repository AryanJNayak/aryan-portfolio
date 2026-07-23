/**
 * Footer component.
 *
 * Purpose: Closing bar with copyright, quick socials, and a discreet admin link.
 *
 * Inputs:  profile (Profile).
 */
import { Link } from "react-router-dom";

import SocialLinks from "@/components/SocialLinks";
import type { Profile } from "@/types";

interface FooterProps {
  profile: Profile;
}

export default function Footer({ profile }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-night-900/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 sm:flex-row sm:justify-between sm:px-8">
        <div className="text-sm text-slate-400">
          © {new Date().getFullYear()} {profile.name}
        </div>
        <SocialLinks socials={profile.socials} email={profile.email} />
        <Link
          to="/admin"
          className="text-xs text-slate-600 transition hover:text-brand-400"
        >
          Admin
        </Link>
      </div>
    </footer>
  );
}
