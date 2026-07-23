/**
 * SocialLinks component.
 *
 * Purpose: Render icon buttons linking to GitHub, LinkedIn, LeetCode,
 *          GeeksforGeeks and email.
 *
 * Inputs:  socials (Socials), email (string), size ("sm"|"lg").
 */
import { FaGithub, FaLinkedin, FaCode } from "react-icons/fa6";
import { SiLeetcode, SiGeeksforgeeks } from "react-icons/si";
import { FiMail } from "react-icons/fi";
import type { IconType } from "react-icons";

import type { Socials } from "@/types";

interface SocialLinksProps {
  socials: Socials;
  email: string;
  size?: "sm" | "lg";
}

export default function SocialLinks({ socials, email, size = "sm" }: SocialLinksProps) {
  const items: { href: string; label: string; Icon: IconType }[] = [
    { href: socials.github, label: "GitHub", Icon: FaGithub },
    { href: socials.linkedin, label: "LinkedIn", Icon: FaLinkedin },
    { href: socials.leetcode, label: "LeetCode", Icon: SiLeetcode },
    { href: socials.geeksforgeeks, label: "GeeksforGeeks", Icon: SiGeeksforgeeks || FaCode },
    { href: `mailto:${email}`, label: "Email", Icon: FiMail },
  ];

  const dim = size === "lg" ? "h-12 w-12 text-xl" : "h-10 w-10 text-lg";

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target={href.startsWith("mailto") ? undefined : "_blank"}
          rel="noreferrer"
          aria-label={label}
          className={`inline-flex ${dim} items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:-translate-y-1 hover:border-brand-400 hover:text-brand-300 hover:shadow-glow`}
        >
          <Icon />
        </a>
      ))}
    </div>
  );
}
