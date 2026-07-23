/**
 * SectionHeading component.
 *
 * Purpose: Consistent animated heading (eyebrow + title) for each section.
 *
 * Inputs:  eyebrow (string) small label, title (string) main heading.
 * Output:  Animated heading block that reveals on scroll.
 */
import { motion } from "framer-motion";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
}

export default function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <motion.div
      className="mb-12 text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
    >
      <p className="section-eyebrow mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold sm:text-4xl">
        <span className="text-gradient">{title}</span>
      </h2>
      <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
    </motion.div>
  );
}
