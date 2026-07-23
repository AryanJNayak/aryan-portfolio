/**
 * TypingCodeWindow component.
 *
 * Purpose: Hero-side code editor that types a developer.json snippet with a
 *          blinking cursor and clear syntax colors. Highlighting is done with
 *          React nodes (not HTML string injection) so class names never leak
 *          into the visible text.
 *
 * Output:  Floating macOS-style window with a looping typewriter effect.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

const SOURCE = `const developer = {
  name: "Aryan Nayak",
  role: "SDE Intern",
  stack: ["React", "FastAPI", "MongoDB"],
  focus: "Full-stack + AI",
  loves: "Solving problems",
};`;

const TYPE_MS = 28;
const HOLD_MS = 2200;
const CLEAR_MS = 16;

type TokenKind = "kw" | "id" | "key" | "str" | "plain";

interface Token {
  kind: TokenKind;
  text: string;
}

/**
 * Purpose: Split the full source into colored tokens once (static analysis).
 * Output:  Token[] covering the entire SOURCE string in order.
 */
function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /(\bconst\b)|(\bdeveloper\b)|(\b(?:name|role|stack|focus|loves)\b(?=\s*:))|("(?:\\.|[^"\\])*")|([\s\S])/g;

  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    if (match[1]) tokens.push({ kind: "kw", text: match[1] });
    else if (match[2]) tokens.push({ kind: "id", text: match[2] });
    else if (match[3]) tokens.push({ kind: "key", text: match[3] });
    else if (match[4]) tokens.push({ kind: "str", text: match[4] });
    else tokens.push({ kind: "plain", text: match[5] });
  }
  return tokens;
}

const TOKENS = tokenize(SOURCE);
const KIND_CLASS: Record<TokenKind, string> = {
  kw: "tc-kw",
  id: "tc-id",
  key: "tc-key",
  str: "tc-str",
  plain: "",
};

/**
 * Purpose: Render only the first `charCount` characters of SOURCE, colored.
 * Inputs:  charCount (number).
 * Output:  React nodes for the typed prefix.
 */
function renderTyped(charCount: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  let seen = 0;

  for (let i = 0; i < TOKENS.length && seen < charCount; i++) {
    const token = TOKENS[i];
    const remaining = charCount - seen;
    const slice = token.text.slice(0, remaining);
    seen += slice.length;
    const cls = KIND_CLASS[token.kind];
    nodes.push(
      cls ? (
        <span key={i} className={cls}>
          {slice}
        </span>
      ) : (
        <span key={i}>{slice}</span>
      ),
    );
  }

  return nodes;
}

export default function TypingCodeWindow() {
  const [charCount, setCharCount] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const indexRef = useRef(0);
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setCharCount(SOURCE.length);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const schedule = (ms: number, fn: () => void) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const step = () => {
      const dir = directionRef.current;
      let next = indexRef.current + dir;

      if (dir === 1 && next >= SOURCE.length) {
        indexRef.current = SOURCE.length;
        setCharCount(SOURCE.length);
        schedule(HOLD_MS, () => {
          directionRef.current = -1;
          step();
        });
        return;
      }

      if (dir === -1 && next <= 0) {
        indexRef.current = 0;
        setCharCount(0);
        directionRef.current = 1;
        schedule(400, step);
        return;
      }

      indexRef.current = next;
      setCharCount(next);
      schedule(dir === 1 ? TYPE_MS : CLEAR_MS, step);
    };

    schedule(400, step);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduceMotion]);

  const content = useMemo(() => renderTyped(charCount), [charCount]);

  return (
    <div className="code-window-float relative overflow-hidden rounded-2xl border border-white/10 bg-night-900 p-6 shadow-glow">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-400/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-indigo-500/15 blur-2xl"
        aria-hidden
      />

      <div className="relative mb-4 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-red-400" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 font-mono text-[11px] tracking-wide text-slate-500">
          developer.json
        </span>
      </div>

      <pre className="relative min-h-[11.5rem] overflow-x-auto whitespace-pre text-sm leading-relaxed text-[#e2e8f0]">
        <code>{content}</code>
        <span className="typing-cursor" aria-hidden />
      </pre>
    </div>
  );
}
