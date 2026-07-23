/**
 * Contact section.
 *
 * Purpose: Working contact form (validated client-side, saved to MongoDB via the
 *          API) plus clickable email and social links. Phone is intentionally
 *          hidden per the owner's preference.
 *
 * Inputs:  profile (Profile).
 */
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiCopy, FiMail, FiMapPin, FiSend } from "react-icons/fi";

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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  /** Purpose: Update a single field and clear its error. */
  const update = (key: keyof ContactForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Purpose: Copy email to clipboard and show brief check feedback. */
  const copyEmail = async () => {
    const address = profile.email.trim();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      // Fallback for older / restricted browsers
      const ta = document.createElement("textarea");
      ta.value = address;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  /** Purpose: Validate then submit the contact form to the API. */
  const handleSubmit = async (e: FormEvent) => {
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

          <div className="flex items-center gap-3 rounded-xl p-4 glass transition hover:border-brand-400/40">
            <FiMail className="shrink-0 text-xl text-brand-400" />
            <a
              href={`mailto:${profile.email.trim()}`}
              onClick={(e) => {
                e.preventDefault();
                window.location.assign(`mailto:${profile.email.trim()}`);
              }}
              className="min-w-0 flex-1"
            >
              <div className="text-xs uppercase tracking-widest text-slate-500">Email</div>
              <div className="truncate text-slate-100">{profile.email}</div>
            </a>
            <button
              type="button"
              onClick={copyEmail}
              aria-label={copied ? "Email copied" : "Copy email"}
              title={copied ? "Copied!" : "Copy email"}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-brand-400 transition hover:border-brand-400/50 hover:bg-brand-500/10 hover:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.4, opacity: 0, rotate: -40 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                    className="flex text-emerald-500"
                  >
                    <FiCheck className="text-lg" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex"
                  >
                    <FiCopy className="text-lg" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

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
