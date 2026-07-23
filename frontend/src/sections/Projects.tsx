/**
 * Projects section.
 *
 * Purpose: Fetch and display the merged (curated + GitHub) project list. The
 *          visible set + order is controlled by `VISIBLE_PROJECTS` in
 *          lib/projectConfig, with an animated project counter. Clicking a
 *          project opens a dedicated detail PAGE (/projects/:id), not a popup.
 *
 * Inputs:  none (fetches its own data).
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import ProjectCard from "@/components/ProjectCard";
import SectionHeading from "@/components/SectionHeading";
import StatCounter from "@/components/StatCounter";
import { getProjects } from "@/api/projects";
import { selectVisibleProjects } from "@/lib/projectConfig";
import type { Project } from "@/types";

/** Shimmer skeleton card shown while projects are fetching. */
function ProjectSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="overflow-hidden rounded-2xl glass shadow-card"
      aria-hidden
    >
      <div className="relative aspect-video overflow-hidden bg-white/5">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <div className="relative h-5 w-3/5 overflow-hidden rounded bg-white/10">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded bg-white/5">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="relative h-3 w-4/5 overflow-hidden rounded bg-white/5">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 rounded-full bg-white/10" />
          <div className="h-5 w-16 rounded-full bg-white/10" />
          <div className="h-5 w-12 rounded-full bg-white/10" />
        </div>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Curated visible set (whitelist + order).
  const visible = useMemo(() => selectVisibleProjects(projects), [projects]);

  /** Navigate to the standalone detail page, passing the project for instant render. */
  const openProject = (project: Project) =>
    navigate(`/projects/${encodeURIComponent(project.id)}`, {
      state: { project },
    });

  return (
    <section id="projects" className="section">
      <SectionHeading eyebrow="Things I've built" title="Projects" />

      {/* Stat counter */}
      <div className="mx-auto mb-10 grid max-w-md grid-cols-1">
        <StatCounter value={visible.length} label="Total Projects" suffix="+" />
      </div>

      {error && !loading && (
        <p className="text-center text-slate-400">
          Couldn't reach the API. Start the backend to load live GitHub
          projects.
        </p>
      )}

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} index={i} />)
          : visible.map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={openProject} />
            ))}
      </motion.div>
    </section>
  );
}
