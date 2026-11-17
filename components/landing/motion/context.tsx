"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AnimationStyle } from "@/lib/page-builder/types";
import { ANIMATION_PRESETS, getAnimationPreset, type AnimationPreset } from "./presets";

const AnimationContext = createContext<AnimationPreset>(ANIMATION_PRESETS.none);

export function AnimationProvider({ style, children }: { style: AnimationStyle | undefined | null; children: ReactNode }) {
  const preset = useMemo(() => getAnimationPreset(style), [style]);
  return <AnimationContext.Provider value={preset}>{children}</AnimationContext.Provider>;
}

/** The active animation preset for this page (theme_config.animation_style). */
export function useAnimationPreset(): AnimationPreset {
  return useContext(AnimationContext);
}
