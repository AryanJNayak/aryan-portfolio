/**
 * Navbar component.
 *
 * Purpose: Sticky top navigation with smooth-scroll section links, a theme
 *          toggle, and a resume download button.
 *
 * Inputs:  theme ("dark"|"light"), onToggleTheme (fn), resumePdf (string url).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";

import DownloadPdfButton from "@/components/DownloadPdfButton";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  resumePdf: string;
}

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#leetcode", label: "LeetCode" },
  { href: "#resume", label: "Resume" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar({ theme, onToggleTheme, resumePdf }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <nav className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full px-5 py-3 glass sm:px-8">
        <a href="#hero" className="font-heading text-lg font-bold tracking-tight">
          <span className="text-gradient">Aryan</span>
          <span className="text-slate-400">.dev</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-slate-300 transition hover:text-brand-300"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="rounded-full border border-white/10 p-2 text-slate-200 transition hover:text-brand-300"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          <div className="hidden sm:block">
            <DownloadPdfButton
              href={resumePdf}
              label="Resume"
              compact
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:bg-brand-400"
            />
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-full border border-white/10 p-2 md:hidden"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl p-4 glass md:hidden"
        >
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-slate-200 transition hover:bg-white/5 hover:text-brand-300"
              >
                {l.label}
              </a>
            </li>
          ))}
        </motion.ul>
      )}
    </motion.header>
  );
}
