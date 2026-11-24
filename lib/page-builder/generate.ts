import { CONTENT_POOLS } from "./pools";
import { mulberry32, pick, randomSeed, shuffle, type Rng } from "./prng";
import { BUTTON_STYLES, LEGACY_THEME, PALETTES, RADII, RANDOM_ANIMATION_STYLES, RANDOM_BACKDROPS, RANDOM_SURFACES, TYPE_STYLES } from "./theme";
import {
  MIDDLE_SECTION_KEYS,
  SECTION_KEYS,
  VARIANT_COUNTS,
  variantId,
  type ContentConfig,
  type LayoutConfig,
  type MiddleSectionKey,
  type PartnerPageConfig,
  type PartnerTestimonial,
  type StatItem,
  type SectionKey,
  type ThemeConfig,
} from "./types";

/** The slice of a partner the generator looks at. */
export interface GenerateSubject {
  testimonials?: PartnerTestimonial[] | null;
}

export interface GenerateOptions {
  /** Fixed seed (tests, reproducing a page). Omit to draw a fresh random one. */
  seed?: number;
  /** Variant 1 + pool entry 1 everywhere, original section order, no animation: the pre-randomizer page. */
  legacy?: boolean;
}

/** Order of sections on the original landing page (it had no testimonials or offer section). */
export const LEGACY_SECTION_ORDER: SectionKey[] = ["navbar", "hero", "features", "steps", "mentor", "stats", "faq", "cta", "footer"];

const OPENERS: readonly MiddleSectionKey[] = ["features", "steps", "stats", "offer"];

function validMiddleOrder(order: readonly MiddleSectionKey[]): boolean {
  return OPENERS.includes(order[0]) && order.indexOf("faq") >= 3 && order[0] !== "mentor";
}

/**
 * navbar first, hero second, cta then footer last; the middle sections are shuffled under a few
 * rules (open with value, not proof; FAQ near the end). Partners with no testimonials of their own
 * get that slot pushed to the end since the renderer skips it anyway.
 */
export function pickSectionOrder(rng: Rng, hasTestimonials: boolean): SectionKey[] {
  const pool = MIDDLE_SECTION_KEYS.filter((k) => hasTestimonials || k !== "testimonials");
  let middle: MiddleSectionKey[] = shuffle(rng, pool);
  for (let attempt = 0; attempt < 64 && !validMiddleOrder(middle); attempt++) middle = shuffle(rng, pool);
  if (!validMiddleOrder(middle)) middle = [...pool]; // MIDDLE_SECTION_KEYS is itself a valid order
  if (!hasTestimonials) middle.push("testimonials");
  return ["navbar", "hero", ...middle, "cta", "footer"];
}

function pickTheme(rng: Rng): ThemeConfig {
  return {
    paletteId: pick(rng, PALETTES).id,
    radius: pick(rng, RADII),
    buttonStyle: pick(rng, BUTTON_STYLES),
    typeStyle: pick(rng, TYPE_STYLES),
    animationStyle: pick(rng, RANDOM_ANIMATION_STYLES),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Builds a ContentConfig by choosing a pool index per section (used by the generator and the dev preview). */
export function buildContent(choose: <K extends SectionKey | "meta">(key: K) => number): ContentConfig {
  const out: Record<string, unknown> = {};
  for (const key of [...SECTION_KEYS, "meta"] as const) {
    const entries = CONTENT_POOLS[key] as { id: string; content: unknown }[];
    const entry = entries[choose(key)];
    out[key] = { id: entry.id, ...clone(entry.content as object) };
  }
  return out as unknown as ContentConfig;
}

const round = (n: number, step: number) => Math.round(n / step) * step;
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);

/** Per-partner stat figures, so two partners' pages never show the same numbers. Saved with the page. */
export function randomStats(rng: Rng): StatItem[] {
  const students = round(between(rng, 18000, 95000), 500);
  const rating = Math.round(between(rng, 4.6, 4.9) * 10) / 10;
  const feedback = Math.round(between(rng, 89, 98));
  const fourth: StatItem[] = [
    { text: "100%", label: "Free Live Access" },
    { end: round(between(rng, 120, 900), 10), suffix: "+", label: "Live Sessions Hosted" },
    { end: Math.round(between(rng, 12, 40)), suffix: "+", label: "Countries Reached" },
  ];
  return [
    { end: students, suffix: "+", label: pick(rng, ["Students Mentored", "Learners Taught", "Traders Trained"]) },
    { end: rating, decimals: 1, suffix: " / 5", label: pick(rng, ["Average Learner Rating", "Average Session Rating"]) },
    { end: feedback, suffix: "%", label: pick(rng, ["Positive Feedback Rate", "Learner Satisfaction"]) },
    pick(rng, fourth),
  ];
}

/**
 * Picks one layout variant and one content set per section, a theme and a section order.
 * Runs ONCE per partner (creation, backfill or an admin "Regenerate page"); the result is saved
 * and every page view only reads it. Same seed in, same page out.
 */
export function generatePartnerPage(partner: GenerateSubject = {}, options: GenerateOptions = {}): PartnerPageConfig {
  const seed = options.seed ?? randomSeed();

  if (options.legacy) {
    const layoutConfig = Object.fromEntries(SECTION_KEYS.map((k) => [k, variantId(k, 1)])) as LayoutConfig;
    return {
      seed,
      layoutConfig,
      contentConfig: buildContent(() => 0),
      themeConfig: { ...LEGACY_THEME },
      sectionOrder: [...LEGACY_SECTION_ORDER],
    };
  }

  const rng = mulberry32(seed);
  const layoutConfig = Object.fromEntries(
    SECTION_KEYS.map((k) => [k, variantId(k, 1 + Math.floor(rng() * VARIANT_COUNTS[k]))])
  ) as LayoutConfig;
  const contentConfig = buildContent((key) => Math.floor(rng() * CONTENT_POOLS[key].length));
  const themeConfig = pickTheme(rng);
  const sectionOrder = pickSectionOrder(rng, (partner.testimonials?.length ?? 0) > 0);
  // Drawn last so every other choice for a given seed is unchanged.
  contentConfig.stats = { ...contentConfig.stats, items: randomStats(rng) };
  themeConfig.backdrop = pick(rng, RANDOM_BACKDROPS);
  themeConfig.surface = pick(rng, RANDOM_SURFACES);

  return { seed, layoutConfig, contentConfig, themeConfig, sectionOrder };
}
