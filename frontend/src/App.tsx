/**
 * App (public site).
 *
 * Purpose: Compose the full one-page portfolio: animated background, navbar, and
 *          every section in order. Fetches the profile once and passes it down.
 *          Also scrolls to `#hash` when arriving from another route (e.g. project detail).
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Experience from "@/sections/Experience";
import Footer from "@/sections/Footer";
import Hero from "@/sections/Hero";
import LeetCode from "@/sections/LeetCode";
import Projects from "@/sections/Projects";
import Resume from "@/sections/Resume";
import Skills from "@/sections/Skills";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const location = useLocation();
  usePageAnalytics();

  // When landing on `/#section` from another page, scroll after sections mount.
  useEffect(() => {
    const id = location.hash.replace(/^#/, "");
    if (!id) return;

    const instant =
      window.matchMedia("(max-width: 768px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
      });
    }, 50);

    return () => window.clearTimeout(t);
  }, [location.hash, location.key]);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar theme={theme} onToggleTheme={toggleTheme} resumePdf={profile.resume_pdf} />

      <main>
        <Hero profile={profile} />
        <About profile={profile} />
        <Experience profile={profile} />
        <Skills profile={profile} />
        <Projects />
        <LeetCode />
        <Resume profile={profile} />
        <Contact profile={profile} />
      </main>

      <Footer profile={profile} />
    </div>
  );
}
