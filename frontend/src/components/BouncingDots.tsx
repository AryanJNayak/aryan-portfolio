/**
 * BouncingDots component.
 *
 * Purpose: Animated "..." with each dot bouncing up and down (staggered).
 *          Used while LeetCode stats are fetching.
 */
import { motion } from "framer-motion";

interface BouncingDotsProps {
  className?: string;
}

export default function BouncingDots({ className = "" }: BouncingDotsProps) {
  return (
    <span
      className={`inline-flex items-end gap-[2px] leading-none ${className}`}
      aria-label="Loading"
      aria-live="polite"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block text-[0.85em]"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.14,
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}
