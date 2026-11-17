"use client";

import dynamic from "next/dynamic";
import type { SectionKey } from "@/lib/page-builder/types";
import { Hero1, Hero2, Hero3, Hero4 } from "./sections/hero";
import { Navbar1, Navbar2, Navbar3 } from "./sections/navbar";
import type { SectionComponent } from "./sections/types";

/** Reserves space while a below-the-fold chunk loads so nothing jumps. */
function SectionSkeleton() {
  return <div aria-hidden className="min-h-[420px]" />;
}
const loading = () => <SectionSkeleton />;

/**
 * Every layout variant of every section, keyed by the ids stored in `layoutConfig`.
 * navbar and hero are bundled eagerly (above the fold); everything else is code-split.
 * All variants of a section share one props type, so they are interchangeable.
 */
export const SECTION_VARIANTS: { [K in SectionKey]: Record<string, SectionComponent<K>> } = {
  navbar: { navbar_1: Navbar1, navbar_2: Navbar2, navbar_3: Navbar3 },
  hero: { hero_1: Hero1, hero_2: Hero2, hero_3: Hero3, hero_4: Hero4 },
  features: {
    features_1: dynamic(() => import("./sections/features").then((m) => m.Features1), { loading }),
    features_2: dynamic(() => import("./sections/features").then((m) => m.Features2), { loading }),
    features_3: dynamic(() => import("./sections/features").then((m) => m.Features3), { loading }),
    features_4: dynamic(() => import("./sections/features").then((m) => m.Features4), { loading }),
  },
  steps: {
    steps_1: dynamic(() => import("./sections/steps").then((m) => m.Steps1), { loading }),
    steps_2: dynamic(() => import("./sections/steps").then((m) => m.Steps2), { loading }),
    steps_3: dynamic(() => import("./sections/steps").then((m) => m.Steps3), { loading }),
  },
  mentor: {
    mentor_1: dynamic(() => import("./sections/mentor").then((m) => m.Mentor1), { loading }),
    mentor_2: dynamic(() => import("./sections/mentor").then((m) => m.Mentor2), { loading }),
    mentor_3: dynamic(() => import("./sections/mentor").then((m) => m.Mentor3), { loading }),
  },
  stats: {
    stats_1: dynamic(() => import("./sections/stats").then((m) => m.Stats1), { loading }),
    stats_2: dynamic(() => import("./sections/stats").then((m) => m.Stats2), { loading }),
    stats_3: dynamic(() => import("./sections/stats").then((m) => m.Stats3), { loading }),
  },
  testimonials: {
    testimonials_1: dynamic(() => import("./sections/testimonials").then((m) => m.Testimonials1), { loading }),
    testimonials_2: dynamic(() => import("./sections/testimonials").then((m) => m.Testimonials2), { loading }),
    testimonials_3: dynamic(() => import("./sections/testimonials").then((m) => m.Testimonials3), { loading }),
  },
  offer: {
    offer_1: dynamic(() => import("./sections/offer").then((m) => m.Offer1), { loading }),
    offer_2: dynamic(() => import("./sections/offer").then((m) => m.Offer2), { loading }),
    offer_3: dynamic(() => import("./sections/offer").then((m) => m.Offer3), { loading }),
  },
  faq: {
    faq_1: dynamic(() => import("./sections/faq").then((m) => m.Faq1), { loading }),
    faq_2: dynamic(() => import("./sections/faq").then((m) => m.Faq2), { loading }),
    faq_3: dynamic(() => import("./sections/faq").then((m) => m.Faq3), { loading }),
  },
  cta: {
    cta_1: dynamic(() => import("./sections/cta").then((m) => m.Cta1), { loading }),
    cta_2: dynamic(() => import("./sections/cta").then((m) => m.Cta2), { loading }),
    cta_3: dynamic(() => import("./sections/cta").then((m) => m.Cta3), { loading }),
  },
  footer: {
    footer_1: dynamic(() => import("./sections/footer").then((m) => m.Footer1), { loading }),
    footer_2: dynamic(() => import("./sections/footer").then((m) => m.Footer2), { loading }),
    footer_3: dynamic(() => import("./sections/footer").then((m) => m.Footer3), { loading }),
  },
};

export function getVariant<K extends SectionKey>(section: K, id: string | undefined): SectionComponent<K> {
  const variants = SECTION_VARIANTS[section] as Record<string, SectionComponent<K>>;
  return (id && variants[id]) || variants[`${section}_1`];
}
