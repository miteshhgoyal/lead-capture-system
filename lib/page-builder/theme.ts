import { deriveSecondary, getReadableTextColor, hexToHsl, hslToHex } from "../theme-utils";
import type { AnimationStyle, ButtonStyle, RadiusStyle, ThemeConfig, TypeStyle } from "./types";

/**
 * A palette recipe says how every tone is *derived from the partner's single brand colour*:
 * how far the gradient partner hue is rotated/lightened and how strongly surfaces pick up the brand tint.
 * Partners only ever configure one colour; the randomizer just varies the recipe.
 */
export interface PaletteRecipe {
  id: string;
  hueShift: number;
  lightShift: number;
  /** Percentage of brand colour mixed into the alternate section background. */
  surfaceTint: number;
}

export const PALETTES: readonly PaletteRecipe[] = [
  { id: "analogous-warm", hueShift: 24, lightShift: 0, surfaceTint: 3 },
  { id: "analogous-cool", hueShift: -28, lightShift: 0, surfaceTint: 3 },
  { id: "complementary", hueShift: 180, lightShift: 0, surfaceTint: 2 },
  { id: "split-complement", hueShift: 150, lightShift: 0, surfaceTint: 2 },
  { id: "triadic", hueShift: 120, lightShift: 0, surfaceTint: 3 },
  { id: "mono-soft", hueShift: 0, lightShift: 0.14, surfaceTint: 4 },
  { id: "mono-deep", hueShift: 0, lightShift: -0.12, surfaceTint: 2 },
  { id: "vivid-shift", hueShift: 60, lightShift: 0.05, surfaceTint: 5 },
  { id: "pastel-wash", hueShift: 18, lightShift: 0.1, surfaceTint: 6 },
  { id: "ink", hueShift: 12, lightShift: -0.06, surfaceTint: 0 },
];

/** The recipe used for pages that must look exactly like the original design. */
export const LEGACY_PALETTE: PaletteRecipe = { id: "legacy", hueShift: 24, lightShift: 0, surfaceTint: 0 };

export const RADII: readonly RadiusStyle[] = ["sharp", "soft", "round"];
export const BUTTON_STYLES: readonly ButtonStyle[] = ["solid", "gradient", "outline", "pill"];
export const TYPE_STYLES: readonly TypeStyle[] = ["classic", "bold", "light", "tight", "airy"];
/** "none" is reserved for legacy pages, the randomizer only picks real presets. */
export const RANDOM_ANIMATION_STYLES: readonly AnimationStyle[] = ["soft-fade", "bold-slide", "typewriter", "blur-stagger"];

export const LEGACY_THEME: ThemeConfig = {
  paletteId: LEGACY_PALETTE.id,
  radius: "soft",
  buttonStyle: "solid",
  typeStyle: "classic",
  animationStyle: "none",
};

const RADIUS_VALUES: Record<RadiusStyle, { xl: string; "2xl": string; "3xl": string }> = {
  sharp: { xl: "0.25rem", "2xl": "0.375rem", "3xl": "0.5rem" },
  soft: { xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
  round: { xl: "1rem", "2xl": "1.5rem", "3xl": "2.25rem" },
};

export function findPalette(id: string): PaletteRecipe {
  return [...PALETTES, LEGACY_PALETTE].find((p) => p.id === id) ?? LEGACY_PALETTE;
}

function secondaryFor(primary: string, recipe: PaletteRecipe): string {
  const shifted = deriveSecondary(primary, recipe.hueShift);
  if (recipe.lightShift === 0) return shifted;
  const { h, s, l } = hexToHsl(shifted);
  return hslToHex(h, s, Math.min(0.9, Math.max(0.1, l + recipe.lightShift)));
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
