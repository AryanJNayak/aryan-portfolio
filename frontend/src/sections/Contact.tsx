/**
 * Contact section.
 *
 * Purpose: Working contact form (validated client-side, saved to MongoDB via the
 *          API) plus clickable email and social links. Phone is intentionally
 *          hidden per the owner's preference.
 *
 * Inputs:  profile (Profile).
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { FiMail, FiMapPin, FiSend } from "react-icons/fi";

import SectionHeading from "@/components/SectionHeading";
import { sendContact } from "@/api/media";
import { validateContact } from "@/schemas";
import type { ContactForm } from "@/types/forms";
import type { Profile } from "@/types";

interface ContactProps {
  profile: Profile;
}

const EMPTY: ContactForm = { name: "", email: "", subject: "", message: "" };

export default function Contact({ profile }: ContactProps) {
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "saved" | "error">("idle");

  /** Purpose: Update a single field and clear its error. */
  const update = (key: keyof ContactForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Purpose: Validate then submit the contact form to the API. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateContact(form);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setStatus("sending");
    try {
      const result = await sendContact(form);
      setStatus(result.emailed ? "sent" : "saved");
      setForm(EMPTY);
    } catch {
      setStatus("error");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40";

  return (
    <section id="contact" className="section">
      <SectionHeading eyebrow="Let's talk" title="Get In Touch" />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: info */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <p className="text-lg text-slate-300">
            Have an opportunity, project, or just want to say hi? My inbox is always open — I'll
            get back to you as soon as I can.
          </p>

          <a
            href={`mailto:${profile.email.trim()}`}
            onClick={(e) => {
              // Harden mailto: some SPA/preview hosts ignore bare href navigation.
              e.preventDefault();
              window.location.assign(`mailto:${profile.email.trim()}`);
            }}
            className="flex items-center gap-3 rounded-xl p-4 glass transition hover:border-brand-400/40"
          >
            <FiMail className="text-xl text-brand-400" />
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Email</div>
              <div className="text-slate-100">{profile.email}</div>
            </div>
          </a>

          <div className="flex items-center gap-3 rounded-xl p-4 glass">
            <FiMapPin className="text-xl text-brand-400" />
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Location</div>
              <div className="text-slate-100">{profile.location}</div>
            </div>
          </div>

          {/* <div>
            <div className="mb-3 text-xs uppercase tracking-widest text-slate-500">Find me on</div>
            <SocialLinks socials={profile.socials} email={profile.email} size="lg" />
          </div> */}
        </motion.div>

        {/* Right: form */}
        <motion.form
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl p-6 glass"
        >
          <div>
            <input
              className={inputCls}
              placeholder="Your name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>
          <div>
            <input
              className={inputCls}
              placeholder="Your email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
          </div>
          <input
            className={inputCls}
            placeholder="Subject (optional)"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
          />
          <div>
            <textarea
              className={`${inputCls} min-h-[140px] resize-y`}
              placeholder="Your message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
            />
            {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
          </div>

          <button type="submit" disabled={status === "sending"} className="btn-primary w-full justify-center">
            <FiSend /> {status === "sending" ? "Sending…" : "Send Message"}
          </button>

          {status === "sent" && (
            <p className="text-center text-sm text-green-400">
              Thanks! Your message has been sent.
            </p>
          )}
          {status === "saved" && (
            <p className="text-center text-sm text-amber-300">
              Message received, but email delivery is temporarily unavailable. I’ll still see it —
              or email me directly at {profile.email}.
            </p>
          )}
          {status === "error" && (
            <p className="text-center text-sm text-red-400">
              Something went wrong. Please email me directly.
            </p>
          )}
        </motion.form>
      </div>
    </section>
  );
}
