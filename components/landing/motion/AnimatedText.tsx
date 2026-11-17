"use client";

import { Fragment, type ElementType } from "react";
import { useAnimationPreset } from "./context";
import { useRevealState, usePrefersReducedMotion } from "./hooks";
import type { CssVars } from "./Reveal";
import type { TextKind } from "./presets";

interface AnimatedTextProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Overrides the preset's text effect. */
  mode?: TextKind;
  /** Above-the-fold: play on first paint. */
  eager?: boolean;
  delay?: number;
  id?: string;
}

const LETTER_MODES: TextKind[] = ["typewriter", "blur-letters"];
const MAX_TOTAL_DELAY = 1400;

/**
 * Word-by-word reveal, mask slide-up, typewriter or blur-in letter stagger.
 * The full text is always present for screen readers and before hydration.
 */
export function AnimatedText({ text, as, className = "", mode, eager = false, delay = 0, id }: AnimatedTextProps) {
  const Tag: ElementType = as ?? "span";
  const preset = useAnimationPreset();
  const reduced = usePrefersReducedMotion();
  const kind = mode ?? preset.text;
  const enabled = kind !== "none" && !reduced;
  const [ref, state] = useRevealState<HTMLElement>({ enabled, eager });

  if (!enabled) {
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    );
  }

  const byLetter = LETTER_MODES.includes(kind);
  const words = text.split(/\s+/).filter(Boolean);
  // Index of each word's first animated unit (letters also count the space after a word).
  const starts = words.reduce<number[]>((acc, _w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (byLetter ? Array.from(words[i - 1]).length + 1 : 1));
    return acc;
  }, []);
  const total = words.length === 0 ? 0 : starts[words.length - 1] + (byLetter ? Array.from(words[words.length - 1]).length : 1);
  const step = Math.min(preset.textStep, MAX_TOTAL_DELAY / Math.max(total, 1));
  const delayOf = (unit: number) => ({ "--d": `${delay + unit * step}ms` }) as CssVars;

  return (
    <Tag ref={ref} id={id} className={className}>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className="rt-text"
        data-mode={kind}
        data-state={state}
        style={{ "--rt-dur": `${preset.duration}ms` } as CssVars}
      >
        {words.map((word, wi) => (
          <Fragment key={wi}>
            <span className="rt-wrap">
              {byLetter ? (
                Array.from(word).map((ch, ci) => (
                  <span key={ci} className="rt-u" style={delayOf(starts[wi] + ci)}>
                    {ch}
                  </span>
                ))
              ) : (
                <span className="rt-u" style={delayOf(starts[wi])}>
                  {word}
                </span>
              )}
            </span>
            {wi < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
