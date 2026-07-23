/**
 * Resume section.
 *
 * Purpose: Embed the resume PDF on desktop; on phone only show Download PDF
 *          and View on Drive (no inline preview / extra copy).
 *
 * Inputs:  profile (Profile) - uses resume_pdf + resume_drive_url.
 */
import { motion } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";

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
        viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl overflow-hidden rounded-2xl glass"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5 md:border-b">
          <h3 className="hidden font-heading text-lg font-semibold text-slate-100 md:block">
            Aryan Nayak — CV
          </h3>
          <div className="flex w-full flex-wrap items-start justify-center gap-3 md:w-auto md:justify-end">
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

        {/* Desktop only: inline PDF preview. */}
        <object
          data={`${pdfUrl}#view=FitH`}
          type="application/pdf"
          className="hidden h-[80vh] w-full bg-night-900 md:block"
          aria-label="Resume PDF preview"
        >
          <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-400">
            <DownloadPdfButton href={pdfUrl} label="Download PDF" />
          </div>
        </object>
      </motion.div>
    </section>
  );
}
