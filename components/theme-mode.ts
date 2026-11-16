"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Theme mode shared by the public site and admin. The `dark` class on <html> is set before
 * paint by the inline boot script in app/layout.tsx (no flash). React reads it through
 * useSyncExternalStore: the server snapshot is "light", so SSR and hydration markup always
 * match, and the real mode is applied right after hydration (no mismatch error).
 */
export const THEME_STORAGE_KEY = "fogm-theme";

export const THEME_BOOT_SCRIPT = `try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}`;

function subscribe(cb: () => void) {
  const ob = new MutationObserver(cb);
  ob.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => ob.disconnect();
}
const read = (): "light" | "dark" => (document.documentElement.classList.contains("dark") ? "dark" : "light");

export function useThemeMode(): { mode: "light" | "dark"; toggle: () => void } {
  const mode = useSyncExternalStore(subscribe, read, () => "light" as const);
  const toggle = useCallback(() => {
    const next = read() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* private mode: ignore */
    }
  }, []);
  return { mode, toggle };
}
