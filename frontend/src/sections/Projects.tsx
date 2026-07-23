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

      {loading && (
        <p className="text-center text-slate-400">Loading projects…</p>
      )}
      {error && (
        <p className="text-center text-slate-400">
          Couldn't reach the API. Start the backend to load live GitHub
          projects.
        </p>
      )}

      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={openProject} />
        ))}
      </motion.div>
    </section>
  );
}
