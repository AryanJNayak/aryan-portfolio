/**
 * DownloadPdfButton component.
 *
 * Purpose: Download a PDF with a visible progress bar while the file streams.
 *
 * Inputs:  href (pdf url), label, className, filename (optional save name).
 */
import { useState } from "react";
import { FiDownload } from "react-icons/fi";

import { downloadWithProgress } from "@/lib/download";

interface DownloadPdfButtonProps {
  href: string;
  label?: string;
  className?: string;
  filename?: string;
  /** Compact variant (e.g. navbar) — progress bar overlays the button. */
  compact?: boolean;
}

export default function DownloadPdfButton({
  href,
  label = "Download PDF",
  className = "btn-primary",
  filename = "AryanNayak.pdf",
  compact = false,
}: DownloadPdfButtonProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const downloading = progress !== null && progress < 100;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    setError(false);
    setProgress(0);
    try {
      await downloadWithProgress(href, filename, setProgress);
      setTimeout(() => setProgress(null), 600);
    } catch {
      setError(true);
      setProgress(null);
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={`inline-flex flex-col ${compact ? "items-stretch" : "items-stretch gap-1.5"}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={downloading}
        aria-busy={downloading}
        className={`${className} relative overflow-hidden disabled:cursor-wait disabled:opacity-90`}
      >
        <span className="relative z-10 inline-flex items-center gap-2">
          <FiDownload />
          {downloading
            ? compact
              ? `${progress}%`
              : `Downloading… ${progress}%`
            : label}
        </span>

        {/* Compact: progress fills the button from the left */}
        {compact && progress !== null && (
          <span
            className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        )}
      </button>

      {/* Full: progress bar under the button */}
      {!compact && progress !== null && (
        <div
          className="h-1.5 w-full min-w-[10rem] overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-400 transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && !compact && (
        <span className="text-xs text-red-400">Download interrupted — opened in a new tab.</span>
      )}
    </div>
  );
}
