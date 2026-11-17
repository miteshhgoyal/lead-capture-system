"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useAnimationPreset } from "./context";
import { useRevealState, usePrefersReducedMotion } from "./hooks";

export type CssVars = CSSProperties & Record<`--${string}`, string | number | undefined>;

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Sibling position: delays the reveal by `index * preset.stagger`. */
  index?: number;
  /** Extra delay in ms. */
  delay?: number;
  /** Above-the-fold content: animate on first paint instead of on scroll. */
  eager?: boolean;
  id?: string;
}

/** Scroll-triggered fade / slide / blur reveal chosen by the page's animation preset. */
export function Reveal({ children, as, className = "", index = 0, delay = 0, eager = false, id }: RevealProps) {
  const Tag: ElementType = as ?? "div";
  const preset = useAnimationPreset();
  const reduced = usePrefersReducedMotion();
  const enabled = preset.reveal !== "none" && !reduced;
  const [ref, state] = useRevealState<HTMLElement>({ enabled, eager });

  const cls =
    state === "idle" ? "" : eager ? "rt-reveal-eager" : state === "shown" ? "rt-reveal is-in" : "rt-reveal";
  const style: CssVars = {
    "--rt-dist": `${preset.distance}px`,
    "--rt-dur": `${preset.duration}ms`,
    "--rt-blur": preset.reveal === "blur" ? "10px" : "0px",
    "--rt-delay": `${delay + index * preset.stagger}ms`,
  };

  return (
    <Tag ref={ref} id={id} className={`${cls} ${className}`.trim()} style={enabled ? style : undefined}>
      {children}
    </Tag>
  );
}
