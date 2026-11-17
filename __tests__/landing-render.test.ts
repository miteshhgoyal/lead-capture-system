import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { AnimationProvider } from "../components/landing/motion";
import * as navbar from "../components/landing/sections/navbar";
import * as hero from "../components/landing/sections/hero";
import * as features from "../components/landing/sections/features";
import * as steps from "../components/landing/sections/steps";
import * as mentor from "../components/landing/sections/mentor";
import * as stats from "../components/landing/sections/stats";
import * as testimonials from "../components/landing/sections/testimonials";
import * as offer from "../components/landing/sections/offer";
import * as faq from "../components/landing/sections/faq";
import * as cta from "../components/landing/sections/cta";
import * as footer from "../components/landing/sections/footer";
import type { PageContext } from "../components/landing/sections/types";
import { CONTENT_POOLS } from "../lib/page-builder/pools";
import { ANIMATION_STYLES, VARIANT_COUNTS, type SectionKey } from "../lib/page-builder/types";

const MODULES: Record<SectionKey, Record<string, unknown>> = { navbar, hero, features, steps, mentor, stats, testimonials, offer, faq, cta, footer };

const ctx: PageContext = {
  brandName: "Test Brand",
  logoUrl: "https://example.com/logo.png",
  mentorName: "Test Mentor",
  mentorBio: "A short bio.",
  telegramLink: "https://t.me/test",
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
