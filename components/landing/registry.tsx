"use client";

import dynamic from "next/dynamic";
import type { SectionContentMap, SectionKey } from "@/lib/page-builder/types";
import { Hero1, Hero2, Hero3, Hero4 } from "./sections/hero";
import { Navbar1, Navbar2, Navbar3 } from "./sections/navbar";
import type { PageContext, SectionComponent } from "./sections/types";

/** Reserves space while a below-the-fold chunk loads so nothing jumps. */
function SectionSkeleton() {
  return <div aria-hidden className="min-h-[420px]" />;
}
const loading = () => <SectionSkeleton />;

/**
 * Every layout variant of every section, keyed by the ids stored in `layoutConfig`.
 * The first navbar and hero designs are bundled eagerly (above the fold); everything else is code-split.
 * Variants 1..N of the original set live in `sections/<name>.tsx`; later additions live in
 * `sections/<name>-more.tsx` so a page only downloads the file holding the variants it uses.
 * All variants of a section share one props type, so they are interchangeable.
 */
export const SECTION_VARIANTS: { [K in SectionKey]: Record<string, SectionComponent<K>> } = {
  navbar: {
    navbar_1: Navbar1,
    navbar_2: Navbar2,
    navbar_3: Navbar3,
    navbar_4: dynamic(() => import("./sections/navbar-more").then((m) => m.Navbar4), { loading }),
    navbar_5: dynamic(() => import("./sections/navbar-more").then((m) => m.Navbar5), { loading }),
    navbar_6: dynamic(() => import("./sections/navbar-more").then((m) => m.Navbar6), { loading }),
    navbar_7: dynamic(() => import("./sections/navbar-more").then((m) => m.Navbar7), { loading }),
    navbar_8: dynamic(() => import("./sections/navbar-more").then((m) => m.Navbar8), { loading }),
    navbar_9: dynamic(() => import("./sections/navbar-more").then((m) => m.Navbar9), { loading }),
  },
  hero: {
    hero_1: Hero1,
    hero_2: Hero2,
    hero_3: Hero3,
    hero_4: Hero4,
    hero_5: dynamic(() => import("./sections/hero-more").then((m) => m.Hero5), { loading }),
    hero_6: dynamic(() => import("./sections/hero-more").then((m) => m.Hero6), { loading }),
    hero_7: dynamic(() => import("./sections/hero-more").then((m) => m.Hero7), { loading }),
    hero_8: dynamic(() => import("./sections/hero-more").then((m) => m.Hero8), { loading }),
    hero_9: dynamic(() => import("./sections/hero-more").then((m) => m.Hero9), { loading }),
    hero_10: dynamic(() => import("./sections/hero-more").then((m) => m.Hero10), { loading }),
    hero_11: dynamic(() => import("./sections/hero-more").then((m) => m.Hero11), { loading }),
    hero_12: dynamic(() => import("./sections/hero-more").then((m) => m.Hero12), { loading }),
  },
  features: {
    features_1: dynamic(() => import("./sections/features").then((m) => m.Features1), { loading }),
    features_2: dynamic(() => import("./sections/features").then((m) => m.Features2), { loading }),
    features_3: dynamic(() => import("./sections/features").then((m) => m.Features3), { loading }),
    features_4: dynamic(() => import("./sections/features").then((m) => m.Features4), { loading }),
    features_5: dynamic(() => import("./sections/features-more").then((m) => m.Features5), { loading }),
    features_6: dynamic(() => import("./sections/features-more").then((m) => m.Features6), { loading }),
    features_7: dynamic(() => import("./sections/features-more").then((m) => m.Features7), { loading }),
    features_8: dynamic(() => import("./sections/features-more").then((m) => m.Features8), { loading }),
    features_9: dynamic(() => import("./sections/features-more").then((m) => m.Features9), { loading }),
    features_10: dynamic(() => import("./sections/features-more").then((m) => m.Features10), { loading }),
    features_11: dynamic(() => import("./sections/features-more").then((m) => m.Features11), { loading }),
    features_12: dynamic(() => import("./sections/features-more").then((m) => m.Features12), { loading }),
  },
  steps: {
    steps_1: dynamic(() => import("./sections/steps").then((m) => m.Steps1), { loading }),
    steps_2: dynamic(() => import("./sections/steps").then((m) => m.Steps2), { loading }),
    steps_3: dynamic(() => import("./sections/steps").then((m) => m.Steps3), { loading }),
    steps_4: dynamic(() => import("./sections/steps-more").then((m) => m.Steps4), { loading }),
    steps_5: dynamic(() => import("./sections/steps-more").then((m) => m.Steps5), { loading }),
    steps_6: dynamic(() => import("./sections/steps-more").then((m) => m.Steps6), { loading }),
    steps_7: dynamic(() => import("./sections/steps-more").then((m) => m.Steps7), { loading }),
    steps_8: dynamic(() => import("./sections/steps-more").then((m) => m.Steps8), { loading }),
    steps_9: dynamic(() => import("./sections/steps-more").then((m) => m.Steps9), { loading }),
  },
  mentor: {
    mentor_1: dynamic(() => import("./sections/mentor").then((m) => m.Mentor1), { loading }),
    mentor_2: dynamic(() => import("./sections/mentor").then((m) => m.Mentor2), { loading }),
    mentor_3: dynamic(() => import("./sections/mentor").then((m) => m.Mentor3), { loading }),
    mentor_4: dynamic(() => import("./sections/mentor-more").then((m) => m.Mentor4), { loading }),
    mentor_5: dynamic(() => import("./sections/mentor-more").then((m) => m.Mentor5), { loading }),
    mentor_6: dynamic(() => import("./sections/mentor-more").then((m) => m.Mentor6), { loading }),
    mentor_7: dynamic(() => import("./sections/mentor-more").then((m) => m.Mentor7), { loading }),
    mentor_8: dynamic(() => import("./sections/mentor-more").then((m) => m.Mentor8), { loading }),
    mentor_9: dynamic(() => import("./sections/mentor-more").then((m) => m.Mentor9), { loading }),
  },
  stats: {
    stats_1: dynamic(() => import("./sections/stats").then((m) => m.Stats1), { loading }),
    stats_2: dynamic(() => import("./sections/stats").then((m) => m.Stats2), { loading }),
    stats_3: dynamic(() => import("./sections/stats").then((m) => m.Stats3), { loading }),
    stats_4: dynamic(() => import("./sections/stats-more").then((m) => m.Stats4), { loading }),
    stats_5: dynamic(() => import("./sections/stats-more").then((m) => m.Stats5), { loading }),
    stats_6: dynamic(() => import("./sections/stats-more").then((m) => m.Stats6), { loading }),
    stats_7: dynamic(() => import("./sections/stats-more").then((m) => m.Stats7), { loading }),
    stats_8: dynamic(() => import("./sections/stats-more").then((m) => m.Stats8), { loading }),
    stats_9: dynamic(() => import("./sections/stats-more").then((m) => m.Stats9), { loading }),
  },
  testimonials: {
    testimonials_1: dynamic(() => import("./sections/testimonials").then((m) => m.Testimonials1), { loading }),
    testimonials_2: dynamic(() => import("./sections/testimonials").then((m) => m.Testimonials2), { loading }),
    testimonials_3: dynamic(() => import("./sections/testimonials").then((m) => m.Testimonials3), { loading }),
    testimonials_4: dynamic(() => import("./sections/testimonials-more").then((m) => m.Testimonials4), { loading }),
    testimonials_5: dynamic(() => import("./sections/testimonials-more").then((m) => m.Testimonials5), { loading }),
    testimonials_6: dynamic(() => import("./sections/testimonials-more").then((m) => m.Testimonials6), { loading }),
    testimonials_7: dynamic(() => import("./sections/testimonials-more").then((m) => m.Testimonials7), { loading }),
    testimonials_8: dynamic(() => import("./sections/testimonials-more").then((m) => m.Testimonials8), { loading }),
    testimonials_9: dynamic(() => import("./sections/testimonials-more").then((m) => m.Testimonials9), { loading }),
  },
  offer: {
    offer_1: dynamic(() => import("./sections/offer").then((m) => m.Offer1), { loading }),
    offer_2: dynamic(() => import("./sections/offer").then((m) => m.Offer2), { loading }),
    offer_3: dynamic(() => import("./sections/offer").then((m) => m.Offer3), { loading }),
    offer_4: dynamic(() => import("./sections/offer-more").then((m) => m.Offer4), { loading }),
    offer_5: dynamic(() => import("./sections/offer-more").then((m) => m.Offer5), { loading }),
    offer_6: dynamic(() => import("./sections/offer-more").then((m) => m.Offer6), { loading }),
    offer_7: dynamic(() => import("./sections/offer-more").then((m) => m.Offer7), { loading }),
    offer_8: dynamic(() => import("./sections/offer-more").then((m) => m.Offer8), { loading }),
    offer_9: dynamic(() => import("./sections/offer-more").then((m) => m.Offer9), { loading }),
  },
  faq: {
    faq_1: dynamic(() => import("./sections/faq").then((m) => m.Faq1), { loading }),
    faq_2: dynamic(() => import("./sections/faq").then((m) => m.Faq2), { loading }),
    faq_3: dynamic(() => import("./sections/faq").then((m) => m.Faq3), { loading }),
    faq_4: dynamic(() => import("./sections/faq-more").then((m) => m.Faq4), { loading }),
    faq_5: dynamic(() => import("./sections/faq-more").then((m) => m.Faq5), { loading }),
    faq_6: dynamic(() => import("./sections/faq-more").then((m) => m.Faq6), { loading }),
    faq_7: dynamic(() => import("./sections/faq-more").then((m) => m.Faq7), { loading }),
    faq_8: dynamic(() => import("./sections/faq-more").then((m) => m.Faq8), { loading }),
    faq_9: dynamic(() => import("./sections/faq-more").then((m) => m.Faq9), { loading }),
  },
  cta: {
    cta_1: dynamic(() => import("./sections/cta").then((m) => m.Cta1), { loading }),
    cta_2: dynamic(() => import("./sections/cta").then((m) => m.Cta2), { loading }),
    cta_3: dynamic(() => import("./sections/cta").then((m) => m.Cta3), { loading }),
    cta_4: dynamic(() => import("./sections/cta-more").then((m) => m.Cta4), { loading }),
    cta_5: dynamic(() => import("./sections/cta-more").then((m) => m.Cta5), { loading }),
    cta_6: dynamic(() => import("./sections/cta-more").then((m) => m.Cta6), { loading }),
    cta_7: dynamic(() => import("./sections/cta-more").then((m) => m.Cta7), { loading }),
    cta_8: dynamic(() => import("./sections/cta-more").then((m) => m.Cta8), { loading }),
    cta_9: dynamic(() => import("./sections/cta-more").then((m) => m.Cta9), { loading }),
  },
  footer: {
    footer_1: dynamic(() => import("./sections/footer").then((m) => m.Footer1), { loading }),
    footer_2: dynamic(() => import("./sections/footer").then((m) => m.Footer2), { loading }),
    footer_3: dynamic(() => import("./sections/footer").then((m) => m.Footer3), { loading }),
    footer_4: dynamic(() => import("./sections/footer-more").then((m) => m.Footer4), { loading }),
    footer_5: dynamic(() => import("./sections/footer-more").then((m) => m.Footer5), { loading }),
    footer_6: dynamic(() => import("./sections/footer-more").then((m) => m.Footer6), { loading }),
    footer_7: dynamic(() => import("./sections/footer-more").then((m) => m.Footer7), { loading }),
    footer_8: dynamic(() => import("./sections/footer-more").then((m) => m.Footer8), { loading }),
    footer_9: dynamic(() => import("./sections/footer-more").then((m) => m.Footer9), { loading }),
  },
};

export function getVariant<K extends SectionKey>(section: K, id: string | undefined): SectionComponent<K> {
  const variants = SECTION_VARIANTS[section] as Record<string, SectionComponent<K>>;
  return (id && variants[id]) || variants[`${section}_1`];
}

/** Renders one section through the registry (unknown ids fall back to variant 1). */
export function RenderSection<K extends SectionKey>({
  name,
  variantId,
  content,
  ctx,
}: {
  name: K;
  variantId: string | undefined;
  content: SectionContentMap[K];
  ctx: PageContext;
}) {
  const Variant = getVariant(name, variantId);
  return <Variant content={content} ctx={ctx} />;
}
