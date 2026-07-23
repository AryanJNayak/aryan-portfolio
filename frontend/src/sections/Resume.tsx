/**
 * Resume section.
 *
 * Purpose: Show the resume with download / Drive actions. Desktop embeds the
 *          PDF inline; mobile browsers rarely support that, so they get a clear
 *          open/download card instead of a broken embed fallback.
 *
 * Inputs:  profile (Profile) - uses resume_pdf + resume_drive_url.
 */
import { motion } from "framer-motion";
import { FiExternalLink, FiFileText } from "react-icons/fi";

import DownloadPdfButton from "@/components/DownloadPdfButton";
import SectionHeading from "@/components/SectionHeading";
import type { Profile } from "@/types";

interface ResumeProps {
  profile: Profile;
}

export default function Resume({ profile }: ResumeProps) {
  const pdfUrl = profile.resume_pdf;

  return (
    <section id="resume" className="section">
      <SectionHeading eyebrow="My background" title="Resume" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl glass"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5">
          <h3 className="font-heading text-lg font-semibold text-slate-100">Aryan Nayak — CV</h3>
          <div className="flex flex-wrap items-start gap-3">
            <DownloadPdfButton href={pdfUrl} label="Download PDF" />
            <a
              href={profile.resume_drive_url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <FiExternalLink /> View on Drive
            </a>
          </div>
        </div>

        {/* Desktop: native PDF embed. Hidden on small screens (phones). */}
        <object
          data={`${pdfUrl}#view=FitH`}
          type="application/pdf"
          className="hidden h-[80vh] w-full bg-night-900 md:block"
          aria-label="Resume PDF preview"
        >
          <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-400">
            <p>PDF preview isn’t available in this browser.</p>
            <DownloadPdfButton href={pdfUrl} label="Download PDF" />
          </div>
        </object>

        {/* Mobile: phones usually can’t embed PDFs — offer open / download instead. */}
        <div className="flex flex-col items-center gap-4 p-8 text-center md:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-brand-300">
            <FiFileText size={28} />
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-slate-100">Resume PDF</p>
            <p className="mt-1 text-sm text-slate-400">
              Phone browsers can’t preview PDFs on the page. Open or download it instead.
            </p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-primary justify-center">
              <FiExternalLink /> Open PDF
            </a>
            <DownloadPdfButton href={pdfUrl} label="Download PDF" />
            <a
              href={profile.resume_drive_url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost justify-center"
            >
              <FiExternalLink /> View on Drive
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
