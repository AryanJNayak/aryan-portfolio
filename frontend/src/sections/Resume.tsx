/**
 * Resume section.
 *
 * Purpose: Embed the resume PDF inline, with buttons to download the local PDF
 *          and open the Google Drive copy.
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
            <DownloadPdfButton href={profile.resume_pdf} label="Download PDF" />
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

        {/* Inline PDF preview (browser native viewer). */}
        <object
          data={`${profile.resume_pdf}#view=FitH`}
          type="application/pdf"
          className="h-[80vh] w-full bg-night-900"
        >
          <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-400">
            <p>Your browser can't display the PDF inline.</p>
            <DownloadPdfButton href={profile.resume_pdf} label="Download it instead" />
          </div>
        </object>
      </motion.div>
    </section>
  );
}
