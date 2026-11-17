import type { ContentConfig, PartnerTestimonial, SectionContentMap, SectionKey } from "./types";

/** Values substituted for {{placeholders}} in pool copy. */
export interface PlaceholderVars {
  partnerName: string;
  brand: string;
  headline: string;
  subheadline: string;
  trustLine: string;
  tagline: string;
}

export const PLACEHOLDER_KEYS: readonly (keyof PlaceholderVars)[] = [
  "partnerName",
  "brand",
  "headline",
  "subheadline",
  "trustLine",
  "tagline",
];

const TOKEN = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

export function fillString(text: string, vars: PlaceholderVars): string {
  return text.replace(TOKEN, (_m, key: string) => (key in vars ? vars[key as keyof PlaceholderVars] : ""));
}

/** Deep-fills every string in a content object. Arrays and nested objects are preserved. */
export function fillPlaceholders<T>(value: T, vars: PlaceholderVars): T {
  if (typeof value === "string") return fillString(value, vars) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => fillPlaceholders(v, vars)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = fillPlaceholders(v, vars);
    return out as T;
  }
  return value;
}

/** Placeholders referenced by a string (used by tests to make sure pools only use known ones). */
export function findPlaceholders(value: unknown, acc: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    for (const m of value.matchAll(TOKEN)) acc.add(m[1]);
  } else if (Array.isArray(value)) {
    value.forEach((v) => findPlaceholders(v, acc));
  } else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) => findPlaceholders(v, acc));
  }
  return acc;
}

export interface PartnerOverrides {
  /** Partner-specific fields that win over whatever the pool says. */
  tagline?: string;
  testimonials?: PartnerTestimonial[];
}

/**
 * Resolves one stored section's content for rendering: fills placeholders, then lets real partner
 * data win over pool copy (a custom tagline replaces the hero headline).
 */
export function resolveSectionContent<K extends SectionKey>(
  section: K,
  stored: ContentConfig[K],
  vars: PlaceholderVars,
  overrides: PartnerOverrides = {}
): SectionContentMap[K] {
  const { id: _id, ...rest } = stored as ContentConfig[K] & { id: string };
  const filled = fillPlaceholders(rest, vars) as unknown as SectionContentMap[K];
  if (section === "hero" && overrides.tagline) {
    return { ...(filled as SectionContentMap["hero"]), headline: overrides.tagline } as SectionContentMap[K];
  }
  return filled;
}
