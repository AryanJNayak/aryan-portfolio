/**
 * Highlight numeric tokens (%, $, ordinals, decimals) inside plain text.
 *
 * Purpose: Emphasize metrics in Achievements / Experience bullet copy.
 * Example: highlightNumbers("Top 17% (5737/33040)") → spans around 17%, 5737, 33040
 */
import { Fragment, type ReactNode } from "react";

const NUMBER_RE = /(\$?\d[\d,]*(?:\.\d+)?(?:%|st|nd|rd|th)?)/g;

export function highlightNumbers(text: string): ReactNode {
  const parts = text.split(NUMBER_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="font-semibold text-brand-300 underline underline-offset-2">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
