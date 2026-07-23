/**
 * ProjectCard component.
 *
 * Purpose: Display a single project with image/video, title, description, tech
 *          chips, rich HTML content, and links (GitHub + live demo).
 *
 * Inputs:  project (Project), onOpen (fn) to open the detail modal.
 */
import { motion } from "framer-motion";
import { FaGithub, FaStar } from "react-icons/fa6";
import { FiArrowUpRight, FiExternalLink } from "react-icons/fi";

import type { Project } from "@/types";
import { getProjectThumbnail } from "@/lib/projectConfig";

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
}

export default function ProjectCard({ project, onOpen }: ProjectCardProps) {
  // Local public Thumbnail/ images for the card only (not the detail page).
  const localThumb = getProjectThumbnail(project.title);
  const cover = localThumb?.src || project.thumbnail || project.images[0];
  // Height applies to the <img> only — the media frame stays aspect-video.
  const imageStyle = localThumb
    ? { height: localThumb.heightCss, width: "100%" }
    : undefined;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -6 }}
      className="group flex flex-col overflow-hidden rounded-2xl glass shadow-card"
    >
      {/* Fixed media frame — component size never changes with thumbnail height */}
      <button
        onClick={() => onOpen(project)}
        className="relative block aspect-video w-full overflow-hidden bg-night-700 text-left"
      >
        {cover ? (
          <img
            src={cover}
            alt={project.title}
            style={imageStyle}
            className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover transition duration-500 group-hover:scale-105 ${
              localThumb ? "" : "h-full w-full"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-night-600 to-night-800">
            <span className="font-heading text-2xl text-brand-400/70">
              {project.title.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        {project.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-500/90 px-3 py-1 text-xs font-semibold text-white">
            Featured
          </span>
        )}
        {project.video_url && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            ▶ Video
          </span>
        )}
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold text-slate-100">
            {project.title}
          </h3>
          {project.stars > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-300">
              <FaStar /> {project.stars}
            </span>
          )}
        </div>

        <p className="mb-4 line-clamp-3 text-sm text-slate-400">
          {project.description || "No description provided."}
        </p>

        {/* Tech chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {project.tech.slice(0, 5).map((t) => (
            <span
              key={t}
              className="rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-0.5 text-xs text-brand-300"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="mt-auto flex items-center gap-3 pt-2">
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition hover:text-brand-300"
            >
              <FaGithub /> Code
            </a>
          )}
          {project.demo_url && (
            <a
              href={project.demo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-slate-300 transition hover:text-brand-300"
            >
              <FiExternalLink /> Demo
            </a>
          )}
          <button
            onClick={() => onOpen(project)}
            className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-brand-400 transition group-hover:gap-2"
          >
            Details <FiArrowUpRight />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
