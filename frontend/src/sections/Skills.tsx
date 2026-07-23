/**
 * Skills section.
 *
 * Purpose: Show skills grouped by category, each with a brand icon.
 *
 * Inputs:  profile (Profile) - uses profile.skills (Record<category, string[]>).
 */
import { motion } from "framer-motion";

import SectionHeading from "@/components/SectionHeading";
import { SkillIcon } from "@/lib/skillIcons";
import type { Profile } from "@/types";

interface SkillsProps {
  profile: Profile;
}

export default function Skills({ profile }: SkillsProps) {
  return (
    <section id="skills" className="section">
      <SectionHeading eyebrow="What I work with" title="Skills & Tech" />

      <div className="space-y-5">
        {Object.entries(profile.skills).map(([category, items], i) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="rounded-2xl p-5 glass sm:flex sm:items-center sm:gap-6"
          >
            <h3 className="mb-4 shrink-0 font-heading text-sm font-semibold uppercase tracking-widest text-brand-300 sm:mb-0 sm:w-40">
              {category}
            </h3>
            <div className="flex flex-wrap gap-3">
              {items.map((skill) => (
                <div
                  key={skill}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-sm text-slate-200 transition hover:-translate-y-0.5 hover:border-brand-400/40"
                >
                  <SkillIcon name={skill} className="text-xl" />
                  <span className="whitespace-nowrap">{skill}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
