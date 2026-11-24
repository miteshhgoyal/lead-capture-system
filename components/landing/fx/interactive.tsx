"use client";

import { useEffect, useRef, useState, type ElementType, type PointerEvent, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../motion/hooks";

/** Pointer-driven surfaces and borders (React Bits-style SpotlightCard, TiltedCard, StarBorder, ShinyText). */

/** A card with a soft accent glow that follows the pointer. Touch devices simply never see the glow. */
export function SpotlightCard({ children, className = "", as }: { children: ReactNode; className?: string; as?: ElementType }) {
  const Tag: ElementType = as ?? "div";
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Tag onPointerMove={onMove} className={`rt-spot ${className}`.trim()}>
      {children}
    </Tag>
  );
}

/** Gentle 3D tilt toward the pointer. Mouse only, and off for reduced motion. */
export function TiltCard({ children, className = "", max = 5 }: { children: ReactNode; className?: string; max?: number }) {
  const reduced = usePrefersReducedMotion();
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };
  return (
    <div onPointerMove={onMove} onPointerLeave={onLeave} className={`rt-tilt ${className}`.trim()}>
      {children}
    </div>
  );
}

/** A comet of light orbiting the border of whatever it wraps. `rounded` must match the child's radius. */
export function StarBorder({ children, className = "", rounded = "rounded-3xl" }: { children: ReactNode; className?: string; rounded?: string }) {
  return (
    <div className={`rt-star ${rounded} ${className}`.trim()}>
      <div className={`rt-star-in ${rounded}`}>{children}</div>
    </div>
  );
}

/** Text with a light sweep passing over it. */
export function ShinyText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`rt-shiny ${className}`.trim()}>{children}</span>;
}

/** True once the page has scrolled past `threshold` px (used by navbars that turn solid on scroll). */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}

/** A thin bar filling with page scroll progress. Writes straight to the DOM, so it never re-renders. */
export function ScrollProgress({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)).toFixed(3) : 0})`;
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return <span ref={ref} aria-hidden="true" className={`pointer-events-none block h-0.5 origin-left scale-x-0 bg-gradient-to-r from-accent to-accent-2 ${className}`.trim()} />;
}
