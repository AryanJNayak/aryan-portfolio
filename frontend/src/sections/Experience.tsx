/**
 * Experience section.
 *
 * Purpose: Timeline of professional experience with role, company, dates and
 *          measurable highlights. Marks the current role.
 *
 * Inputs:  profile (Profile).
 */
import { motion } from "framer-motion";
import { FiBriefcase } from "react-icons/fi";

import SectionHeading from "@/components/SectionHeading";
import type { Profile } from "@/types";

interface ExperienceProps {
  profile: Profile;
}

export default function Experience({ profile }: ExperienceProps) {
  return (
    <section id="experience" className="section">
      <SectionHeading eyebrow="Where I've worked" title="Experience" />

      <div className="relative mx-auto max-w-3xl">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-brand-400/60 to-transparent sm:left-6" />

        {profile.experience.map((exp, i) => (
          <motion.div
            key={`${exp.company}-${i}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative mb-8 pl-12 sm:pl-16"
          >
            {/* Node */}
            <span className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full border border-brand-400/40 bg-night-800 text-brand-400 sm:h-12 sm:w-12">
              <FiBriefcase />
            </span>

            <div className="rounded-2xl p-5 glass">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold text-slate-100">{exp.role}</h3>
                {exp.current && (
                  <span className="rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-medium text-green-300">
                    Current
                  </span>
                )}
              </div>
              <div className="text-brand-300">{exp.company}</div>
              <div className="mb-3 text-sm text-slate-400">
                {exp.start} – {exp.end} · {exp.location}
              </div>
              <ul className="space-y-2">
                {exp.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-brand-400">➤</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
