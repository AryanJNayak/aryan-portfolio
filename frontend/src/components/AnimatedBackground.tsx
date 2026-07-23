/**
 * AnimatedBackground component.
 *
 * Purpose: Render a fixed, GPU-friendly animated backdrop behind the whole page.
 *          - Dark theme:  pure black base with soft glowing brand blobs.
 *          - Light theme: clean off-white base with faint pastel blobs.
 *          No grid overlay in either theme.
 *
 * Output:  A fixed, non-interactive background layer.
 */
import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base fill: solid black in dark, soft (non-glaring) light wash in light. */}
      <div className="absolute inset-0 bg-slate-200 dark:bg-black" />

      {/* Floating blurred blobs (subtle in light, richer in dark). */}
      <motion.div
        className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-600/20"
        animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brand-300/10 blur-3xl dark:bg-brand-400/15"
        animate={{ y: [0, -50, 0], x: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-600/15"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
