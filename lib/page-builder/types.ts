/**
 * Shared types for the per-partner landing page system.
 *
 * Everything in this folder is plain TypeScript (no React) so the generator can run in
 * route handlers, scripts and tests without pulling in the component tree.
 */

export const SECTION_KEYS = [
  "navbar",
  "hero",
  "features",
  "steps",
  "mentor",
  "stats",
  "testimonials",
  "offer",
  "faq",
  "cta",
  "footer",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/** Sections that are shuffled. navbar is always first, hero second, cta then footer last. */
export const MIDDLE_SECTION_KEYS = [
  "features",
  "steps",
  "mentor",
  "stats",
  "testimonials",
  "offer",
  "faq",
] as const satisfies readonly SectionKey[];
export type MiddleSectionKey = (typeof MIDDLE_SECTION_KEYS)[number];

/**
 * How many layout variants each section ships with. Variants 1..N-of-the-original-set are the first
 * designs and stay exactly as they were (saved pages reference them by id); the rest were added later.
 */
export const VARIANT_COUNTS: Record<SectionKey, number> = {
  navbar: 9,
  hero: 12,
  features: 12,
  steps: 9,
  mentor: 9,
  stats: 9,
  testimonials: 9,
  offer: 9,
  faq: 9,
  cta: 9,
  footer: 9,
};

export function variantId(section: SectionKey, n: number): string {
  return `${section}_${n}`;
}

export function variantIds(section: SectionKey): string[] {
  return Array.from({ length: VARIANT_COUNTS[section] }, (_, i) => variantId(section, i + 1));
}

/* ── Icons (rendered through lucide-react, see components/ui/icons.tsx) ───────── */

export const ICON_KEYS = [
  "trend",
  "shield",
  "candles",
  "brain",
  "video",
  "zap",
  "users",
  "target",
  "send",
  "lock",
  "clock",
  "gift",
  "badge",
  "graduation",
  "chart",
  "message",
  "book",
  "calendar",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

/* ── Theme ─────────────────────────────────────────────────────────────────── */

export const ANIMATION_STYLES = ["none", "soft-fade", "bold-slide", "typewriter", "blur-stagger"] as const;
export type AnimationStyle = (typeof ANIMATION_STYLES)[number];

export type RadiusStyle = "sharp" | "soft" | "round";
export type ButtonStyle = "solid" | "gradient" | "outline" | "pill";
/** Inter is the only typeface; these presets change weight, tracking and case only. */
export type TypeStyle = "classic" | "bold" | "light" | "tight" | "airy";

/** The fixed atmosphere behind every section. Absent on pages saved before backdrops existed (= "blobs"). */
export const BACKDROPS = ["blobs", "aurora", "grid", "dots", "beams", "mesh", "noise"] as const;
export type Backdrop = (typeof BACKDROPS)[number];

/** How cards look page-wide. Absent on older pages (= "solid"). */
export const SURFACES = ["solid", "glass", "glow", "outline"] as const;
export type Surface = (typeof SURFACES)[number];

export interface ThemeConfig {
  paletteId: string;
  radius: RadiusStyle;
  buttonStyle: ButtonStyle;
  typeStyle: TypeStyle;
  animationStyle: AnimationStyle;
  backdrop?: Backdrop;
  surface?: Surface;
}

/* ── Content (one shape per section; every variant of a section shares it) ───── */

export type NavLinkKey = "features" | "steps" | "mentor" | "offer" | "testimonials" | "faq";

export interface NavbarContent {
  ctaLabel: string;
  links: Record<NavLinkKey, string>;
}

export interface HeroHighlight {
  icon: IconKey;
  title: string;
  body: string;
}

export interface HeroContent {
  /** Small pill above the headline. Empty string falls back to the site trust line. */
  badge: string;
  headline: string;
  subheadline: string;
  mobileCta: string;
  highlights: HeroHighlight[];
}

export type FeatureVisual = "area" | "risk" | "candles" | "discipline";

export interface FeatureItem {
  icon: IconKey;
  title: string;
  body: string;
  visual?: FeatureVisual;
}

export interface FeaturesContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: FeatureItem[];
}

export interface StepsContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: { title: string; body: string }[];
}

export interface MentorContent {
  role: string;
  badge: string;
  title: string;
  body: string;
  ctaLabel: string;
}

export interface StatItem {
  /** Animated counter target. Omit and set `text` for a static value. */
  end?: number;
  decimals?: number;
  suffix?: string;
  text?: string;
  label: string;
}

export interface StatsContent {
  items: StatItem[];
}

/** Heading copy only. The quotes themselves come from the partner's own testimonials. */
export interface TestimonialsContent {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export interface OfferContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  priceNote: string;
  items: string[];
  ctaLabel: string;
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Omitted means "use the admin-editable FAQs from site settings". */
  items?: { q: string; a: string }[];
}

export interface CtaContent {
  eyebrow: string;
  title: string;
  body: string;
  button: string;
}

export interface FooterContent {
  tagline: string;
}

export interface MetaContent {
  title: string;
  description: string;
}

export interface SectionContentMap {
  navbar: NavbarContent;
  hero: HeroContent;
  features: FeaturesContent;
  steps: StepsContent;
  mentor: MentorContent;
  stats: StatsContent;
  testimonials: TestimonialsContent;
  offer: OfferContent;
  faq: FaqContent;
  cta: CtaContent;
  footer: FooterContent;
}

/** Content as stored: the chosen pool entry id plus a copy of its text (placeholders unresolved). */
export type StoredContent<T> = T & { id: string };

export type ContentConfig = {
  [K in SectionKey]: StoredContent<SectionContentMap[K]>;
} & { meta: StoredContent<MetaContent> };

export type LayoutConfig = Record<SectionKey, string>;

/** Everything the generator persists on a partner. */
export interface PartnerPageConfig {
  seed: number;
  layoutConfig: LayoutConfig;
  contentConfig: ContentConfig;
  themeConfig: ThemeConfig;
  sectionOrder: SectionKey[];
}

export interface PartnerTestimonial {
  name: string;
  role?: string;
  quote: string;
}
