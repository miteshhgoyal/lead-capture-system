import type { ComponentType } from "react";
import type { PartnerTestimonial, SectionContentMap, SectionKey } from "@/lib/page-builder/types";

/** Resolved, render-ready data shared by every section (partner fields override pool content). */
export interface PageContext {
  brandName: string;
  logoUrl: string;
  mentorName: string;
  mentorBio: string;
  /** Community links are only shown on the lead form's success screen. Empty = not offered. */
  telegramLink: string;
  whatsappLink: string;
  partnerSlug: string;
  trustLine: string;
  disclaimer: string;
  /** Admin-editable FAQs from site settings (used when a FAQ set doesn't carry its own). */
  faqs: { q: string; a: string }[];
  /** The partner's own testimonials. Empty means the testimonials section is not rendered. */
  testimonials: PartnerTestimonial[];
  /** Anchor links for sections present on the page, in page order, already labelled. */
  navLinks: { id: string; label: string }[];
  /** Dev preview: the lead form is replaced by a static placeholder so nothing can be submitted. */
  preview?: boolean;
}

/** Every variant of a section takes exactly these props so they are interchangeable. */
export interface SectionProps<K extends SectionKey> {
  content: SectionContentMap[K];
  ctx: PageContext;
}

export type SectionComponent<K extends SectionKey> = ComponentType<SectionProps<K>>;

/** Anchor ids used by nav links and `href="#..."` targets. */
export const SECTION_ANCHORS: Partial<Record<SectionKey, string>> = {
  features: "learn",
  steps: "how",
  mentor: "mentor",
  stats: "stats",
  testimonials: "reviews",
  offer: "offer",
  faq: "faq",
};
