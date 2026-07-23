/**
 * ProjectDetail page.
 *
 * Purpose: Standalone page (route /projects/:id) that shows a single project's
 *          details — title, description, media, tech, and the GitHub README
 *          (fetched live when the project has a github_url).
 *
 * Data:    Uses the project passed via router state (instant render when opened
 *          from a card) and falls back to fetching it by id (direct link /
 *          refresh). README is always fetched separately from GitHub.
 */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaGithub } from "react-icons/fa6";
import { FiArrowLeft, FiExternalLink } from "react-icons/fi";

import AnimatedBackground from "@/components/AnimatedBackground";
import Navbar from "@/components/Navbar";
import { getProjectReadme } from "@/api/github";
import { getProjectById } from "@/api/projects";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import type { Project } from "@/types";

export default function ProjectDetail() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();

  const preloaded = (location.state as { project?: Project } | null)?.project ?? null;
  const [project, setProject] = useState<Project | null>(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [notFound, setNotFound] = useState(false);

  const [readmeHtml, setReadmeHtml] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState(false);

  useEffect(() => {
    if (preloaded) return;
    let alive = true;
    setLoading(true);
    getProjectById(id)
      .then((p) => alive && setProject(p))
      .catch(() => alive && setNotFound(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, preloaded]);

  // Load the GitHub README whenever we have a github_url.
  useEffect(() => {
    if (!project?.github_url) {
      setReadmeHtml(null);
      setReadmeError(false);
      return;
    }
    let alive = true;
    setReadmeLoading(true);
    setReadmeError(false);
    getProjectReadme(project.github_url)
      .then((r) => alive && setReadmeHtml(r.html))
      .catch(() => {
        if (alive) {
          setReadmeHtml(null);
          setReadmeError(true);
        }
      })
      .finally(() => alive && setReadmeLoading(false));
    return () => {
      alive = false;
    };
  }, [project?.github_url]);

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar theme={theme} onToggleTheme={toggleTheme} resumePdf={profile.resume_pdf} />

      <main className="section pt-28">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/#projects"))}
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-brand-300"
        >
          <FiArrowLeft /> Back to projects
        </button>

        {loading && (
          <div className="mx-auto max-w-3xl space-y-4" aria-busy aria-label="Loading project">
            <div className="relative h-10 w-2/3 overflow-hidden rounded-lg bg-white/10">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-white/5">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded bg-white/5">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative h-4 w-5/6 overflow-hidden rounded bg-white/5">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        )}

        {notFound && !loading && (
          <div className="rounded-2xl p-10 text-center glass">
            <p className="text-slate-300">This project could not be found.</p>
            <Link to="/#projects" className="btn-primary mt-6 inline-flex">
              Browse all projects
            </Link>
          </div>
        )}

        {project && !loading && (
          <motion.article
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-4xl"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-bold text-gradient sm:text-4xl">
                {project.title}
              </h1>
              {project.featured && (
                <span className="rounded-full bg-brand-500/90 px-3 py-1 text-xs font-semibold text-white">
                  Featured
                </span>
              )}
            </div>

            {project.description && (
              <p className="mb-6 max-w-2xl text-lg text-slate-400">{project.description}</p>
            )}

            {/* Links */}
            <div className="mb-8 flex flex-wrap gap-3">
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noreferrer" className="btn-ghost">
                  <FaGithub /> View Code
                </a>
              )}
              {project.demo_url && (
                <a href={project.demo_url} target="_blank" rel="noreferrer" className="btn-primary">
                  <FiExternalLink /> Live Demo
                </a>
              )}
            </div>

            {/* Tech stack */}
            {project.tech.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 font-heading text-lg font-semibold text-slate-100">
                  Tech stack
                </h2>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-brand-400/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Demo video */}
            {project.video_url && (
              <video
                src={project.video_url}
                controls
                className="mb-8 w-full rounded-2xl border border-white/10"
              />
            )}

            {/* Image gallery */}
            {project.images.length > 0 && (
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                {project.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={project.title}
                    className="w-full rounded-2xl border border-white/10 object-cover"
                  />
                ))}
              </div>
            )}

            {/* Admin write-up (optional curated content) */}
            {project.content_html && (
              <div
                className="prose-rich mb-8 max-w-none text-slate-300"
                dangerouslySetInnerHTML={{ __html: project.content_html }}
              />
            )}

            {/* GitHub README */}
            {project.github_url && (
              <section className="mt-2">
                <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-slate-100">
                  <FaGithub /> README
                </h2>

                {readmeLoading && (
                  <p className="rounded-2xl p-6 text-sm text-slate-400 glass">Loading README…</p>
                )}

                {readmeError && !readmeLoading && (
                  <p className="rounded-2xl p-6 text-sm text-slate-400 glass">
                    No README found for this repository, or GitHub is unreachable.
                  </p>
                )}

                {readmeHtml && !readmeLoading && (
                  <div
                    className="readme-body overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-8"
                    dangerouslySetInnerHTML={{ __html: readmeHtml }}
                  />
                )}
              </section>
            )}
          </motion.article>
        )}
      </main>
    </div>
  );
}
