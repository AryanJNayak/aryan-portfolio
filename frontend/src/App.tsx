/**
 * App (public site).
 *
 * Purpose: Compose the full one-page portfolio: animated background, navbar, and
 *          every section in order. Fetches the profile once and passes it down.
 */
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

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();

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
