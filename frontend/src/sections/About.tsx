/**
 * About section.
 *
 * Purpose: Short bio + quick facts (current role, location, education) and a
 *          highlight of key achievements.
 *
 * Inputs:  profile (Profile).
 */
import { motion } from "framer-motion";
import { FiAward, FiBriefcase, FiMapPin } from "react-icons/fi";

import SectionHeading from "@/components/SectionHeading";
import { highlightNumbers } from "@/lib/highlightNumbers";
import type { Profile } from "@/types";

interface AboutProps {
  profile: Profile;
}

export default function About({ profile }: AboutProps) {
  const currentJob = profile.experience.find((e) => e.current) ?? profile.experience[0];

  return (
    <section id="about" className="section">
      <SectionHeading eyebrow="Get to know me" title="About Me" />

      <div className="grid gap-8 md:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="md:col-span-3"
        >
          <p className="text-lg leading-relaxed text-slate-300">
            I'm a <strong className="text-brand-300">Software Development Engineer</strong> and
            MCA graduate based in Ahmedabad, passionate about building scalable full-stack
            applications and AI-powered products. Currently interning at{" "}
            <strong className="text-brand-300">{currentJob?.company}</strong>, I work across
            FastAPI, Python, React and TypeScript — shipping features that measurably cut costs
            and manual effort.
          </p>
          <p className="mt-4 leading-relaxed text-slate-400">
            I enjoy turning complex problems into clean, efficient solutions — from RAG systems
            and OCR pipelines to high-performance data ingestion. I'm also an active competitive
            programmer on LeetCode and GeeksforGeeks.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { Icon: FiBriefcase, label: "Current", value: "SDE Intern" },
              { Icon: FiMapPin, label: "Based in", value: "Ahmedabad, IN" },
              { Icon: FiAward, label: "GfG Rank", value: "Top 0.5%" },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="rounded-xl p-4 glass">
                <Icon className="mb-2 text-brand-400" />
                <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
                <div className="font-semibold text-slate-100">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Education + achievements */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-4 md:col-span-2"
        >
          <div className="rounded-2xl p-5 glass">
            <h3 className="mb-3 font-heading text-lg font-semibold text-slate-100">Education</h3>
            <ul className="space-y-3">
              {profile.education.map((edu) => (
                <li key={edu.degree} className="border-l-2 border-brand-500/50 pl-3">
                  <div className="font-medium text-slate-100">{edu.degree}</div>
                  <div className="text-sm text-slate-400">{edu.institution}</div>
                  <div className="text-xs text-brand-300">
                    {edu.start} – {edu.end} · {edu.score}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-5 glass">
            <h3 className="mb-3 font-heading text-lg font-semibold text-slate-100">Achievements</h3>
            <ul className="space-y-2">
              {profile.achievements.map((a) => (
                <li key={a} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-brand-400">➤</span>
                  <span>{highlightNumbers(a)}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
