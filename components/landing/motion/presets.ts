import type { AnimationStyle } from "@/lib/page-builder/types";

export type RevealKind = "none" | "fade" | "slide" | "blur";
export type TextKind = "none" | "words" | "mask" | "typewriter" | "blur-letters";

export interface AnimationPreset {
  style: AnimationStyle;
  /** Scroll reveal applied to sections and their children. */
  reveal: RevealKind;
  /** Distance (px) the element travels while revealing. */
  distance: number;
  /** Duration (ms) of a reveal or a single text unit. */
  duration: number;
  /** Delay (ms) added per sibling index (staggered children). */
  stagger: number;
  /** Headline text effect. */
  text: TextKind;
  /** Per-unit (word / letter) delay in ms. */
  textStep: number;
  hoverLift: boolean;
  parallax: boolean;
  floatingShapes: boolean;
}

export const ANIMATION_PRESETS: Record<AnimationStyle, AnimationPreset> = {
  none: {
    style: "none",
    reveal: "none",
    distance: 0,
    duration: 0,
    stagger: 0,
    text: "none",
    textStep: 0,
    hoverLift: false,
    parallax: false,
    floatingShapes: false,
  },
  "soft-fade": {
    style: "soft-fade",
    reveal: "fade",
    distance: 14,
    duration: 650,
    stagger: 70,
    text: "words",
    textStep: 55,
    hoverLift: true,
    parallax: false,
    floatingShapes: false,
  },
  "bold-slide": {
    style: "bold-slide",
    reveal: "slide",
    distance: 44,
    duration: 750,
    stagger: 90,
    text: "mask",
    textStep: 70,
    hoverLift: true,
    parallax: true,
    floatingShapes: true,
  },
  typewriter: {
    style: "typewriter",
    reveal: "fade",
    distance: 8,
    duration: 500,
    stagger: 60,
    text: "typewriter",
    textStep: 26,
    hoverLift: false,
    parallax: false,
    floatingShapes: false,
  },
  "blur-stagger": {
    style: "blur-stagger",
    reveal: "blur",
    distance: 18,
    duration: 800,
    stagger: 80,
    text: "blur-letters",
    textStep: 24,
    hoverLift: true,
    parallax: false,
    floatingShapes: true,
  },
};

export function getAnimationPreset(style: AnimationStyle | undefined | null): AnimationPreset {
  return ANIMATION_PRESETS[style ?? "none"] ?? ANIMATION_PRESETS.none;
}
