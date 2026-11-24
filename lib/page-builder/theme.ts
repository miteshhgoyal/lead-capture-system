import { getLuminance, getReadableTextColor, hexToHsl, hslToHex } from "../theme-utils";
import type { AnimationStyle, Backdrop, ButtonStyle, RadiusStyle, Surface, ThemeConfig, TypeStyle } from "./types";

/**
 * A palette recipe says how the gradient partner of the brand colour is derived from it.
 * Every recipe stays inside the brand colour's own family: at most a few degrees of hue drift plus a
 * lighter/deeper (and slightly more/less saturated) shade, so a blue brand only ever gets blues.
 * Partners only ever configure one colour; the randomizer just varies the shade recipe.
 */
export interface PaletteRecipe {
  id: string;
  /** Small hue drift in degrees (kept within about ±12° so the colour family never changes). */
  hueShift: number;
  /** Positive = lighter shade, negative = deeper shade. */
  lightShift: number;
  /** Saturation change (-1..1 scale, typically ±0.1). */
  satShift?: number;
  /** Percentage of brand colour mixed into the alternate section background. */
  surfaceTint: number;
}

// The ids are kept from the first version so pages that already stored one keep a valid recipe.
export const PALETTES: readonly PaletteRecipe[] = [
  { id: "analogous-warm", hueShift: 10, lightShift: 0.1, surfaceTint: 3 },
  { id: "analogous-cool", hueShift: -10, lightShift: 0.1, surfaceTint: 3 },
  { id: "complementary", hueShift: 0, lightShift: -0.14, surfaceTint: 2 },
  { id: "split-complement", hueShift: 6, lightShift: -0.1, satShift: 0.05, surfaceTint: 2 },
  { id: "triadic", hueShift: -6, lightShift: 0.14, surfaceTint: 3 },
  { id: "mono-soft", hueShift: 0, lightShift: 0.14, surfaceTint: 4 },
  { id: "mono-deep", hueShift: 0, lightShift: -0.12, surfaceTint: 2 },
  { id: "vivid-shift", hueShift: 8, lightShift: 0.06, satShift: 0.1, surfaceTint: 5 },
  { id: "pastel-wash", hueShift: 4, lightShift: 0.16, satShift: -0.1, surfaceTint: 6 },
  { id: "ink", hueShift: 0, lightShift: -0.18, surfaceTint: 0 },
];

/** The recipe used for pages that must look exactly like the original design. */
export const LEGACY_PALETTE: PaletteRecipe = { id: "legacy", hueShift: 12, lightShift: 0.08, surfaceTint: 0 };

export const RADII: readonly RadiusStyle[] = ["sharp", "soft", "round"];
export const BUTTON_STYLES: readonly ButtonStyle[] = ["solid", "gradient", "outline", "pill"];
export const TYPE_STYLES: readonly TypeStyle[] = ["classic", "bold", "light", "tight", "airy"];
/** "none" is reserved for legacy pages, the randomizer only picks real presets. */
export const RANDOM_ANIMATION_STYLES: readonly AnimationStyle[] = ["soft-fade", "bold-slide", "typewriter", "blur-stagger"];

/** Page backdrops the randomizer picks from. */
export const RANDOM_BACKDROPS: readonly Backdrop[] = ["blobs", "aurora", "grid", "dots", "beams", "mesh", "noise"];
/** Card surfaces the randomizer picks from: "solid" is listed twice so most pages keep plain cards. */
export const RANDOM_SURFACES: readonly Surface[] = ["solid", "solid", "glass", "glow", "outline"];

export const LEGACY_THEME: ThemeConfig = {
  paletteId: LEGACY_PALETTE.id,
  radius: "soft",
  buttonStyle: "solid",
  typeStyle: "classic",
  animationStyle: "none",
  backdrop: "blobs",
  surface: "solid",
};

const RADIUS_VALUES: Record<RadiusStyle, { xl: string; "2xl": string; "3xl": string }> = {
  sharp: { xl: "0.25rem", "2xl": "0.375rem", "3xl": "0.5rem" },
  soft: { xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
  round: { xl: "1rem", "2xl": "1.5rem", "3xl": "2.25rem" },
};

export function findPalette(id: string): PaletteRecipe {
  return [...PALETTES, LEGACY_PALETTE].find((p) => p.id === id) ?? LEGACY_PALETTE;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function contrast(a: string, b: string): number {
  const la = getLuminance(a);
  const lb = getLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * The gradient partner: a lighter or deeper shade of the same colour. If the requested direction has no
 * room (a very light/dark brand colour) it flips, and the result must keep the button text readable.
 */
function secondaryFor(primary: string, recipe: PaletteRecipe): string {
  const { h, s, l } = hexToHsl(primary);
  const ink = getReadableTextColor(primary);
  const sat = clamp(s + (recipe.satShift ?? 0), 0.05, 1);
  const build = (shift: number) => hslToHex(h + recipe.hueShift, sat, clamp(l + shift, 0.1, 0.9));
  let shift = recipe.lightShift;
  if (Math.abs(clamp(l + shift, 0.1, 0.9) - l) < 0.05) shift = -shift;
  let out = build(shift);
  for (let i = 0; i < 6 && contrast(ink, out) < 3; i++) {
    shift *= 0.6;
    out = build(shift);
  }
  return out;
}

/**
 * CSS custom properties for the page root. They override the existing design tokens
 * (--accent, --accent-2, --accent-ink, --bg-alt) and Tailwind's radius scale, so every
 * component picks them up without knowing about themes.
 */
export function buildThemeVars(primaryColor: string | undefined, theme: ThemeConfig): Record<string, string> {
  const recipe = findPalette(theme.paletteId);
  const radii = RADIUS_VALUES[theme.radius] ?? RADIUS_VALUES.soft;
  const vars: Record<string, string> = {
    "--radius-xl": radii.xl,
    "--radius-2xl": radii["2xl"],
    "--radius-3xl": radii["3xl"],
  };
  // Without a partner brand colour the site's own accent is kept.
  if (primaryColor) {
    vars["--accent"] = primaryColor;
    vars["--accent-2"] = secondaryFor(primaryColor, recipe);
    vars["--accent-ink"] = getReadableTextColor(primaryColor);
    if (recipe.surfaceTint > 0) {
      vars["--bg-alt"] = `color-mix(in oklab, var(--bg) ${100 - recipe.surfaceTint}%, var(--accent) ${recipe.surfaceTint}%)`;
    }
  }
  return vars;
}
