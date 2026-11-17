"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}

/**
 * idle   -> server render / before hydration: content is fully visible (no-JS safe, no layout shift)
 * hidden -> armed: below the fold, waiting to scroll into view
 * shown  -> revealed (or eager: plays on first paint)
 */
export type RevealState = "idle" | "hidden" | "shown";

export function useRevealState<T extends HTMLElement>({ enabled, eager = false }: { enabled: boolean; eager?: boolean }) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>(enabled && eager ? "shown" : "idle");

  useEffect(() => {
    if (!enabled) {
      setState("idle");
      return;
    }
    if (eager) {
      setState("shown");
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setState("shown");
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      setState("shown"); // already on screen: nothing to animate in
      return;
    }
    setState("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, eager]);

  return [ref, state] as const;
}
