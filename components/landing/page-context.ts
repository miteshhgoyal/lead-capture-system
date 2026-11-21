import { DEFAULT_SETTINGS, type SiteSettingsData } from "@/lib/defaults";
import { fillString, resolveSectionContent, type PlaceholderVars } from "@/lib/page-builder/resolve";
import { buildThemeVars } from "@/lib/page-builder/theme";
import type {
  ContentConfig,
  LayoutConfig,
  NavLinkKey,
  PartnerTestimonial,
  SectionContentMap,
  SectionKey,
  ThemeConfig,
} from "@/lib/page-builder/types";
import { SECTION_ANCHORS, type PageContext } from "./sections/types";

/** The partner fields the landing page needs: plain, serialisable values only. */
export interface PartnerView {
  name?: string;
  slug?: string;
  telegramLink?: string;
  whatsappLink?: string;
  tagline?: string;
  mentorBio?: string;
  logoUrl?: string;
  theme?: { primaryColor?: string };
  testimonials?: PartnerTestimonial[];
}

/** A saved page: which variant per section, what copy, which theme, in what order. */
export interface PagePlan {
  layoutConfig: LayoutConfig;
  contentConfig: ContentConfig;
  themeConfig: ThemeConfig;
  sectionOrder: SectionKey[];
}

export interface ResolvedPage {
  ctx: PageContext;
  /** Sections to render, in order (testimonials is dropped when the partner has none). */
  order: SectionKey[];
  content: { [K in SectionKey]: SectionContentMap[K] };
  themeVars: Record<string, string>;
  vars: PlaceholderVars;
}

const NAV_KEYS: Partial<Record<SectionKey, NavLinkKey>> = {
  features: "features",
  steps: "steps",
  mentor: "mentor",
  offer: "offer",
  testimonials: "testimonials",
  faq: "faq",
};

export function resolvePage({
  partner,
  settings,
  isCustomPartner,
  plan,
  preview = false,
  formMode = "lead",
}: {
  partner?: PartnerView | null;
  settings: SiteSettingsData;
  isCustomPartner: boolean;
  plan: PagePlan;
  preview?: boolean;
  formMode?: "lead" | "partner";
}): ResolvedPage {
  const brandName = isCustomPartner && partner?.name ? partner.name : settings.brandName;
  const tagline = isCustomPartner && partner?.tagline ? partner.tagline : undefined;
  const testimonials = isCustomPartner ? (partner?.testimonials ?? []) : [];

  const vars: PlaceholderVars = {
    partnerName: partner?.name || settings.defaultMentorName,
    brand: brandName,
    headline: tagline ?? settings.headline,
    subheadline: settings.subheadline,
    trustLine: settings.trustLine || "100% Free · Join 60,000+ Enrolled Students",
    tagline: tagline ?? settings.subheadline,
  };

  const order = plan.sectionOrder.filter((k) => k !== "testimonials" || testimonials.length > 0);

  const content = Object.fromEntries(
    order.map((k) => [k, resolveSectionContent(k, plan.contentConfig[k], vars, { tagline })])
  ) as ResolvedPage["content"];

  const navLabels = (content.navbar ?? resolveSectionContent("navbar", plan.contentConfig.navbar, vars)).links;
  const navLinks = order.flatMap((k) => {
    const navKey = NAV_KEYS[k];
    const anchor = SECTION_ANCHORS[k];
    return navKey && anchor ? [{ id: anchor, label: fillString(navLabels[navKey], vars) }] : [];
  });

  const ctx: PageContext = {
    brandName,
    // No logo uploaded = no image: the navbar/footer show the name in caps instead of someone else's logo.
    // A partner page only ever shows the partner's own logo; the root page ignores the bundled placeholder.
    logoUrl: isCustomPartner
      ? partner?.logoUrl || ""
      : settings.logoUrl && settings.logoUrl !== DEFAULT_SETTINGS.logoUrl
        ? settings.logoUrl
        : "",
    mentorName: partner?.name || settings.defaultMentorName,
    mentorBio: partner?.mentorBio || settings.defaultMentorBio,
    telegramLink: (isCustomPartner ? partner?.telegramLink : "") || settings.defaultTelegramLink || "",
    whatsappLink: (isCustomPartner ? partner?.whatsappLink : "") || settings.defaultWhatsappLink || "",
    partnerSlug: partner?.slug || "direct",
    trustLine: vars.trustLine,
    disclaimer: settings.disclaimer || "Trading involves risk. Educational purposes only. No guaranteed returns.",
    faqs: settings.faqs || [],
    testimonials,
    navLinks,
    preview,
    formMode,
  };

  const primary = (isCustomPartner ? partner?.theme?.primaryColor : settings.primaryColor) || undefined;
  return { ctx, order, content, themeVars: buildThemeVars(primary, plan.themeConfig), vars };
}
