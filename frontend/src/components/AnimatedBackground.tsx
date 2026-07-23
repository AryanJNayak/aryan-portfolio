/**
 * AnimatedBackground component.
 *
 * Purpose: Render a fixed backdrop behind the whole page.
 *          - Desktop: soft glowing brand blobs (Framer Motion).
 *          - Mobile / reduced-motion: static soft gradients (no perpetual paint).
 *
 * Output:  A fixed, non-interactive background layer.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function useStaticBackdrop() {
  const [staticBg, setStaticBg] = useState(true);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 768px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStaticBg(mqMobile.matches || mqReduce.matches);
    sync();
    mqMobile.addEventListener("change", sync);
    mqReduce.addEventListener("change", sync);
    return () => {
      mqMobile.removeEventListener("change", sync);
      mqReduce.removeEventListener("change", sync);
    };
  }, []);

  return staticBg;
}

export default function AnimatedBackground() {
  const staticBg = useStaticBackdrop();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base fill: solid black in dark, soft light wash in light. */}
      <div className="absolute inset-0 bg-slate-200 dark:bg-black" />

      {staticBg ? (
        /* Cheap static wash — avoids blur+transform every frame on phones. */
        <>
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand-400/15 dark:bg-brand-600/25" />
          <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-brand-300/10 dark:bg-brand-400/20" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-400/10 dark:bg-indigo-600/20" />
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
