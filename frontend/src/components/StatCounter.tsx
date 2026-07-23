/**
 * StatCounter component.
 *
 * Purpose: Animated number that counts up from 0 to `value` when scrolled into
 *          view. Used for the "projects count", ratings and KPIs.
 *
 * Inputs:  value (number), label (string), suffix (string, optional).
 */
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface StatCounterProps {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
}

export default function StatCounter({ value, label, suffix = "", decimals = 0 }: StatCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic for a snappy finish.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="rounded-2xl p-5 text-center glass"
    >
      <div className="text-3xl font-bold text-gradient sm:text-4xl">
        {display.toFixed(decimals)}
        {suffix}
      </div>
      <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">{label}</div>
    </motion.div>
  );
}
