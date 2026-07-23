/**
 * LeetCode section.
 *
 * Purpose: Mini LeetCode profile card showing rating, KPIs (solved by
 *          difficulty), top contest performances, and a redirect to the profile.
 *          Falls back to verified resume data if the API is unavailable.
 *
 * Inputs:  none (fetches its own data).
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SiLeetcode } from "react-icons/si";
import { FiExternalLink, FiTrendingUp } from "react-icons/fi";
import { FaTrophy } from "react-icons/fa6";

import BouncingDots from "@/components/BouncingDots";
import SectionHeading from "@/components/SectionHeading";
import { getLeetCodeStats } from "@/api/leetcode";
import { FALLBACK_LEETCODE } from "@/lib/fallback";
import type { LeetCodeStats } from "@/types";

export default function LeetCode() {
  const [stats, setStats] = useState<LeetCodeStats>(FALLBACK_LEETCODE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeetCodeStats()
      .then(setStats)
      .catch(() => setStats(FALLBACK_LEETCODE))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Easy", value: stats.easy_solved, color: "text-green-400" },
    { label: "Medium", value: stats.medium_solved, color: "text-amber-400" },
    { label: "Hard", value: stats.hard_solved, color: "text-red-400" },
  ];

  return (
    <section id="leetcode" className="section">
      <SectionHeading eyebrow="Competitive programming" title="LeetCode Profile" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl glass"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-brand-600/20 to-transparent p-6">
          <div className="flex items-center gap-4">
            <SiLeetcode className="text-4xl text-[#FFA116]" />
            <div>
              <div className="font-heading text-xl font-bold text-slate-100">@{stats.username}</div>
              <div className="text-sm text-slate-400">LeetCode Competitive Programmer</div>
            </div>
          </div>
          <a href={stats.profile_url} target="_blank" rel="noreferrer" className="btn-primary">
            <FiExternalLink /> View Profile
          </a>
        </div>

        {/* Body */}
        <div className="grid gap-6 p-6 md:grid-cols-3">
          {/* Rating */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
            <FiTrendingUp className="mx-auto mb-2 text-2xl text-brand-400" />
            <div className="text-3xl font-bold text-gradient">
              {stats.highest_rating ?? stats.current_rating ?? "—"}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">
              Highest Rating
            </div>
          </div>

          {/* Solved / KPIs */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 text-center">
              <div className="text-3xl font-bold text-slate-100">
                {loading ? <BouncingDots className="text-brand-300" /> : stats.total_solved || "—"}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-400">Problems Solved</div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {kpis.map((k) => (
                <div key={k.label}>
                  <div className={`text-lg font-semibold ${k.color}`}>
                    {loading ? <BouncingDots /> : k.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    {k.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contests attended */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
            <FaTrophy className="mx-auto mb-2 text-2xl text-amber-300" />
            <div className="text-3xl font-bold text-slate-100">
              {stats.attended_contests || stats.top_contests.length}
            </div>
            <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">
              Contests Rated
            </div>
          </div>
        </div>

        {/* Top contests */}
        <div className="border-t border-white/10 p-6">
          <h4 className="mb-4 flex items-center gap-2 font-heading font-semibold text-slate-100">
            <FaTrophy className="text-amber-300" /> Top Contest Performances
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.top_contests.map((c) => {
              // Prefer API percentage; otherwise compute from rank / total.
              const pct =
                c.percentage_top ??
                (c.ranking != null && c.total_participants
                  ? Math.round((c.ranking / c.total_participants) * 1000) / 10
                  : null);

              return (
                <div
                  key={c.title}
                  className="rounded-xl border border-brand-400/20 bg-brand-500/5 p-4"
                >
                  <div className="text-sm font-medium text-slate-100">{c.title}</div>
                  {pct != null && (
                    <div className="mt-1 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-300">
                      Top {pct}%
                    </div>
                  )}
                  {c.ranking != null && (
                    <div className="mt-2 text-xs text-slate-400">
                      Rank #{c.ranking.toLocaleString()}
                      {c.total_participants != null && (
                        <> / {c.total_participants.toLocaleString()}</>
                      )}
                    </div>
                  )}
                  {c.rating != null && (
                    <div className="text-xs text-brand-300">Rating {c.rating}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
