/**
 * Resume section.
 *
 * Purpose: Embed the resume PDF when the browser can preview inline PDFs;
 *          otherwise only show Download PDF and View on Drive (phones and
 *          other clients without an embedded viewer — including desktop-mode
 *          spoof on mobile).
 *
 * Inputs:  profile (Profile) - uses resume_pdf + resume_drive_url.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { FiExternalLink } from "react-icons/fi";

import DownloadPdfButton from "@/components/DownloadPdfButton";
import SectionHeading from "@/components/SectionHeading";
import { supportsInlinePdf } from "@/lib/pdfPreview";
import type { Profile } from "@/types";

interface ResumeProps {
  profile: Profile;
}

export default function Resume({ profile }: ResumeProps) {
  const pdfUrl = profile.resume_pdf;
  const [canPreview] = useState(supportsInlinePdf);

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
        <div
          className={`flex flex-wrap items-center justify-between gap-4 p-5 ${
            canPreview ? "border-b border-white/10" : ""
          }`}
        >
          {canPreview ? (
            <h3 className="font-heading text-lg font-semibold text-slate-100">
              Aryan Nayak — CV
            </h3>
          ) : null}
          <div
            className={`flex flex-wrap items-start justify-center gap-3 ${
              canPreview ? "w-auto justify-end" : "w-full"
            }`}
          >
            <DownloadPdfButton href={pdfUrl} label="Download PDF" source="resume" />
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

        {canPreview ? (
          <object
            data={`${pdfUrl}#view=FitH`}
            type="application/pdf"
            className="h-[80vh] w-full bg-night-900"
            aria-label="Resume PDF preview"
          >
            <div className="flex flex-col items-center gap-4 p-10 text-center text-slate-400">
              <DownloadPdfButton href={pdfUrl} label="Download PDF" source="resume" />
            </div>
          </object>
        ) : null}
      </motion.div>
    </section>
  );
}
