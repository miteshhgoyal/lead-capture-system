import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { AnimationProvider } from "../components/landing/motion";
import * as navbar from "../components/landing/sections/navbar";
import * as navbarMore from "../components/landing/sections/navbar-more";
import * as hero from "../components/landing/sections/hero";
import * as heroMore from "../components/landing/sections/hero-more";
import * as features from "../components/landing/sections/features";
import * as featuresMore from "../components/landing/sections/features-more";
import * as steps from "../components/landing/sections/steps";
import * as stepsMore from "../components/landing/sections/steps-more";
import * as mentor from "../components/landing/sections/mentor";
import * as mentorMore from "../components/landing/sections/mentor-more";
import * as stats from "../components/landing/sections/stats";
import * as statsMore from "../components/landing/sections/stats-more";
import * as testimonials from "../components/landing/sections/testimonials";
import * as testimonialsMore from "../components/landing/sections/testimonials-more";
import * as offer from "../components/landing/sections/offer";
import * as offerMore from "../components/landing/sections/offer-more";
import * as faq from "../components/landing/sections/faq";
import * as faqMore from "../components/landing/sections/faq-more";
import * as cta from "../components/landing/sections/cta";
import * as ctaMore from "../components/landing/sections/cta-more";
import * as footer from "../components/landing/sections/footer";
import * as footerMore from "../components/landing/sections/footer-more";
import type { PageContext } from "../components/landing/sections/types";
import { CONTENT_POOLS } from "../lib/page-builder/pools";
import { PageBackdrop } from "../components/landing/fx/PageBackdrop";
import { ANIMATION_STYLES, BACKDROPS, VARIANT_COUNTS, type SectionKey } from "../lib/page-builder/types";

/** Original variants live in <section>.tsx, later additions in <section>-more.tsx. */
const MODULES: Record<SectionKey, Record<string, unknown>> = {
  navbar: { ...navbar, ...navbarMore },
  hero: { ...hero, ...heroMore },
  features: { ...features, ...featuresMore },
  steps: { ...steps, ...stepsMore },
  mentor: { ...mentor, ...mentorMore },
  stats: { ...stats, ...statsMore },
  testimonials: { ...testimonials, ...testimonialsMore },
  offer: { ...offer, ...offerMore },
  faq: { ...faq, ...faqMore },
  cta: { ...cta, ...ctaMore },
  footer: { ...footer, ...footerMore },
};

const ctx: PageContext = {
  brandName: "Test Brand",
  logoUrl: "https://example.com/logo.png",
  mentorName: "Test Mentor",
  mentorBio: "A short bio.",
  telegramLink: "https://t.me/test",
  whatsappLink: "https://chat.whatsapp.com/test",
  partnerSlug: "test",
  trustLine: "100% Free",
  disclaimer: "Trading involves risk.",
  faqs: [{ q: "Question?", a: "Answer." }],
  testimonials: [
    { name: "Asha Rao", role: "Pune", quote: "A clear and useful session overall." },
    { name: "Dev Patel", quote: "Helped me think about risk differently." },
  ],
  navLinks: [{ id: "learn", label: "What You'll Learn" }],
  preview: true,
};

describe("section variants render", () => {
  for (const section of Object.keys(MODULES) as SectionKey[]) {
    for (let n = 1; n <= VARIANT_COUNTS[section]; n++) {
      const exportName = `${section[0].toUpperCase()}${section.slice(1)}${n}`;
      it(`${section}_${n} renders under every animation preset with first and last pool content`, () => {
        const Cmp = MODULES[section][exportName] as ComponentType<{ content: unknown; ctx: PageContext }> | undefined;
        assert.ok(Cmp, `${exportName} is not exported`);
        const pool = CONTENT_POOLS[section];
        for (const style of ANIMATION_STYLES) {
          for (const entry of [pool[0], pool[pool.length - 1]]) {
            const html = renderToString(
              createElement(AnimationProvider, { style, children: createElement(Cmp, { content: entry.content, ctx }) })
            );
            assert.ok(html.length > 40, `${exportName}/${style}/${entry.id} rendered nothing`);
            assert.ok(!html.includes("undefined"), `${exportName}/${style}/${entry.id} leaked "undefined"`);
          }
        }
      });
    }
  }
});

describe("page backdrops", () => {
  for (const kind of BACKDROPS) {
    it(`PageBackdrop renders "${kind}"`, () => {
      const html = renderToString(createElement(PageBackdrop, { kind }));
      assert.ok(html.length > 20);
      assert.ok(!html.includes("undefined"));
    });
  }

  it("falls back to the original blobs when a page has no backdrop", () => {
    assert.equal(renderToString(createElement(PageBackdrop, {})), renderToString(createElement(PageBackdrop, { kind: "blobs" })));
  });
});
