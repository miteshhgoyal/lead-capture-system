"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimationPreset } from "./context";
import { usePrefersReducedMotion } from "./hooks";
import type { CssVars } from "./Reveal";

/** Brand-gradient text; shimmers when the preset allows motion. */
export function GradientText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`rt-gradient-text ${className}`.trim()}>{children}</span>;
}

/** Infinite horizontal ticker. Pauses on hover and stops entirely for reduced motion. */
export function Marquee({
  children,
  durationSeconds = 32,
  gap = 16,
  className = "",
}: {
  children: ReactNode;
  durationSeconds?: number;
  gap?: number;
  className?: string;
}) {
  return (
    <div className={`rt-marquee ${className}`.trim()}>
      <div
        className="rt-marquee-track"
        style={{ "--rt-gap": `${gap}px`, "--rt-marquee-dur": `${durationSeconds}s` } as CssVars}
      >
        <div className="rt-marquee-group">{children}</div>
        <div className="rt-marquee-group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Decorative drifting shapes. Rendered only when the preset asks for them. */
export function FloatingShapes({ className = "" }: { className?: string }) {
  const preset = useAnimationPreset();
  if (!preset.floatingShapes) return null;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}>
      <span className="rt-float absolute -left-6 top-10 size-24 rounded-full border border-accent/30" />
      <span
        className="rt-float absolute right-[8%] top-[18%] size-14 rounded-2xl bg-accent/10"
        style={{ animationDelay: "-3s" }}
      />
      <span
        className="rt-float absolute bottom-10 left-[22%] size-10 rounded-full bg-accent-2/15"
        style={{ animationDelay: "-6s" }}
      />
      <span
        className="rt-float absolute bottom-[14%] right-[-1.5rem] size-28 rounded-3xl border border-accent-2/25"
        style={{ animationDelay: "-1.5s" }}
      />
    </div>
  );
}

/** Moves its child slightly slower than the scroll. No-op unless the preset enables parallax. */
export function Parallax({ children, speed = 0.12, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const preset = useAnimationPreset();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const enabled = preset.parallax && !reduced;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
