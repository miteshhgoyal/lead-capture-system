import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generatePartnerPage, LEGACY_SECTION_ORDER, pickSectionOrder } from "../lib/page-builder/generate";
import { mulberry32 } from "../lib/page-builder/prng";
import { CONTENT_POOLS } from "../lib/page-builder/pools";
import { fillPlaceholders, findPlaceholders, PLACEHOLDER_KEYS, resolveMeta, resolveSectionContent, type PlaceholderVars } from "../lib/page-builder/resolve";
import { buildThemeVars, LEGACY_THEME, PALETTES, TYPE_STYLES } from "../lib/page-builder/theme";
import { hasPageConfig } from "../lib/page-builder/validate";
import { ICON_KEYS, SECTION_KEYS, VARIANT_COUNTS, variantIds, type SectionContentMap, type SectionKey } from "../lib/page-builder/types";
import { SECTION_VARIANTS } from "../components/landing/registry";
import { ICON_MAP } from "../components/ui/icons";

const PARTNERS = 50;
const pages = Array.from({ length: PARTNERS }, (_, i) => generatePartnerPage({}, { seed: i + 1 }));

describe("generatePartnerPage", () => {
  it("is deterministic for a given seed and differs between seeds", () => {
    assert.deepEqual(generatePartnerPage({}, { seed: 1234 }), generatePartnerPage({}, { seed: 1234 }));
    assert.notDeepEqual(generatePartnerPage({}, { seed: 1 }), generatePartnerPage({}, { seed: 2 }));
  });

  it("draws a fresh random seed when none is given", () => {
    const a = generatePartnerPage({});
    const b = generatePartnerPage({});
    assert.equal(typeof a.seed, "number");
    assert.notEqual(a.seed, b.seed);
  });

  it("mulberry32 yields floats in [0, 1) and repeats for equal seeds", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      assert.ok(v >= 0 && v < 1);
      assert.equal(v, b());
    }
  });

  it("every chosen layout and content key exists in the registry and pools", () => {
    for (const page of pages) {
      for (const section of SECTION_KEYS) {
        const variant = page.layoutConfig[section];
        assert.ok(variantIds(section).includes(variant), `${section}: ${variant}`);
        assert.ok(variant in SECTION_VARIANTS[section], `registry is missing ${variant}`);
        const stored = page.contentConfig[section];
        assert.ok(CONTENT_POOLS[section].some((e) => e.id === stored.id), `pool is missing ${stored.id}`);
      }
      assert.ok(CONTENT_POOLS.meta.some((e) => e.id === page.contentConfig.meta.id));
      assert.ok(PALETTES.some((p) => p.id === page.themeConfig.paletteId));
      assert.ok(hasPageConfig(page));
    }
  });

  it("produces variety across partners", () => {
    for (const section of SECTION_KEYS) {
      const used = new Set(pages.map((p) => p.layoutConfig[section]));
      assert.ok(used.size >= Math.min(3, VARIANT_COUNTS[section]), `${section} only used ${used.size} variants`);
    }
    assert.ok(new Set(pages.map((p) => p.sectionOrder.join())).size >= 20, "section orders barely vary");
    assert.ok(new Set(pages.map((p) => p.themeConfig.paletteId)).size >= 6, "palettes barely vary");
    assert.equal(new Set(pages.map((p) => p.themeConfig.animationStyle)).size, 4);
    assert.ok(new Set(pages.map((p) => p.themeConfig.radius)).size >= 3);
    assert.ok(new Set(pages.map((p) => p.themeConfig.buttonStyle)).size >= 3);
    assert.ok(new Set(pages.map((p) => p.contentConfig.hero.id)).size >= 5);
    assert.ok(new Set(pages.map((p) => p.contentConfig.faq.id)).size >= 3);
  });

  it("keeps navbar, hero, cta, footer in place and never repeats a section", () => {
    for (const { sectionOrder } of pages) {
      assert.deepEqual(sectionOrder.slice(0, 2), ["navbar", "hero"]);
      assert.deepEqual(sectionOrder.slice(-2), ["cta", "footer"]);
      assert.equal(new Set(sectionOrder).size, sectionOrder.length);
      assert.equal(sectionOrder.length, SECTION_KEYS.length);
    }
  });

  it("applies the ordering rules (value before proof, FAQ near the end)", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const order = pickSectionOrder(mulberry32(seed), true);
      const middle = order.slice(2, -2);
      assert.ok(["features", "steps", "stats", "offer"].includes(middle[0]), order.join());
      assert.ok(middle.indexOf("faq") >= 3, order.join());
    }
  });

  it("pushes testimonials to the end for partners without any", () => {
    const order = pickSectionOrder(mulberry32(5), false);
    assert.equal(order[order.length - 3], "testimonials");
  });

  it("legacy mode reproduces the original page", () => {
    const legacy = generatePartnerPage({}, { legacy: true });
    for (const section of SECTION_KEYS) {
      assert.equal(legacy.layoutConfig[section], `${section}_1`);
      assert.equal(legacy.contentConfig[section].id, `${section}_c1`);
    }
    assert.equal(legacy.contentConfig.meta.id, "meta_c1");
    assert.deepEqual(legacy.sectionOrder, LEGACY_SECTION_ORDER);
    assert.deepEqual(legacy.themeConfig, LEGACY_THEME);
    assert.equal(legacy.themeConfig.animationStyle, "none");
  });
});

describe("registry and pools", () => {
  it("registry holds exactly the variants the generator can pick", () => {
    for (const section of SECTION_KEYS) {
      assert.deepEqual(Object.keys(SECTION_VARIANTS[section]).sort(), variantIds(section).sort());
    }
  });

  it("meets the required variant counts", () => {
    assert.deepEqual(
      { navbar: 3, hero: 4, features: 4, steps: 3, testimonials: 3, offer: 3, faq: 3, cta: 3, footer: 3 },
      {
        navbar: VARIANT_COUNTS.navbar,
        hero: VARIANT_COUNTS.hero,
        features: VARIANT_COUNTS.features,
        steps: VARIANT_COUNTS.steps,
        testimonials: VARIANT_COUNTS.testimonials,
        offer: VARIANT_COUNTS.offer,
        faq: VARIANT_COUNTS.faq,
        cta: VARIANT_COUNTS.cta,
        footer: VARIANT_COUNTS.footer,
      }
    );
  });

  it("meets the required content pool sizes", () => {
    assert.ok(CONTENT_POOLS.hero.length >= 8);
    assert.ok(CONTENT_POOLS.features.length >= 4);
    assert.ok(CONTENT_POOLS.steps.length >= 4);
    assert.ok(CONTENT_POOLS.testimonials.length >= 6);
    assert.ok(CONTENT_POOLS.faq.length >= 4);
    assert.ok(CONTENT_POOLS.cta.length >= 5);
    assert.ok(PALETTES.length >= 8);
    assert.ok(TYPE_STYLES.length >= 5);
  });

  it("pool ids are unique and only use known placeholders and icons", () => {
    const known = new Set<string>(PLACEHOLDER_KEYS);
    for (const key of [...SECTION_KEYS, "meta"] as const) {
      const ids = CONTENT_POOLS[key].map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, `${key} has duplicate ids`);
      for (const entry of CONTENT_POOLS[key]) {
        for (const ph of findPlaceholders(entry.content)) assert.ok(known.has(ph), `${entry.id} uses {{${ph}}}`);
      }
    }
    const icons = new Set<string>(ICON_KEYS);
    for (const k of ICON_KEYS) assert.ok(k in ICON_MAP, `no lucide icon for ${k}`);
    for (const e of CONTENT_POOLS.hero) for (const h of e.content.highlights) assert.ok(icons.has(h.icon));
    for (const e of CONTENT_POOLS.features) for (const i of e.content.items) assert.ok(icons.has(i.icon));
  });

  it("keeps the original copy as entry #1 and contains no emoji", () => {
    assert.equal(CONTENT_POOLS.features[0].content.eyebrow, "CORE CURRICULUM");
    assert.equal(CONTENT_POOLS.steps[0].content.items[0].title, "Register Your Free Pass");
    assert.equal(CONTENT_POOLS.cta[0].content.title, "Ready to Level Up Your Trading Game?");
    assert.equal(CONTENT_POOLS.faq[0].content.items, undefined, "faq #1 must defer to site settings");
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
    assert.ok(!emoji.test(JSON.stringify(CONTENT_POOLS)));
  });
});

describe("placeholders and overrides", () => {
  const vars: PlaceholderVars = {
    partnerName: "Aman Singh",
    brand: "Aman Singh",
    headline: "Custom headline",
    subheadline: "Site sub",
    trustLine: "Trust",
    tagline: "Custom tagline",
  };

  it("fills {{placeholders}} deeply", () => {
    const out = fillPlaceholders({ a: "Hi {{partnerName}}", b: [{ c: "{{ brand }}!" }], n: 3 }, vars);
    assert.deepEqual(out, { a: "Hi Aman Singh", b: [{ c: "Aman Singh!" }], n: 3 });
  });

  it("a custom partner tagline overrides the hero headline, other sections are untouched", () => {
    const stored = generatePartnerPage({}, { seed: 9 }).contentConfig;
    const hero = resolveSectionContent("hero", stored.hero, vars, { tagline: "Mine" });
    assert.equal(hero.headline, "Mine");
    const features = resolveSectionContent("features", stored.features, vars, { tagline: "Mine" });
    assert.ok(features.items.length > 0);
    assert.equal(resolveMeta(stored.meta, vars, "Mine").description, "Mine");
  });

  it("original hero copy resolves to the site's headline, subheadline and trust line", () => {
    const stored = generatePartnerPage({}, { legacy: true }).contentConfig;
    const hero: SectionContentMap["hero"] = resolveSectionContent("hero", stored.hero, vars);
    assert.equal(hero.headline, "Custom headline");
    assert.equal(hero.subheadline, "Site sub");
    assert.equal(hero.badge, "Trust");
  });

  it("every chosen page resolves without leftover {{tokens}}", () => {
    for (const page of pages) {
      for (const section of SECTION_KEYS as readonly SectionKey[]) {
        const resolved = resolveSectionContent(section, page.contentConfig[section], vars);
        assert.equal(findPlaceholders(resolved).size, 0);
      }
    }
  });
});

describe("theme", () => {
  it("derives every tone from the single brand colour", () => {
    const vars = buildThemeVars("#059669", generatePartnerPage({}, { seed: 3 }).themeConfig);
    assert.equal(vars["--accent"], "#059669");
    assert.match(vars["--accent-2"], /^#[0-9a-f]{6}$/);
    assert.ok(["#ffffff", "#0b0b1a"].includes(vars["--accent-ink"]));
    assert.ok(vars["--radius-xl"]);
  });

  it("keeps the site accent when no brand colour is set", () => {
    const vars = buildThemeVars(undefined, LEGACY_THEME);
    assert.equal(vars["--accent"], undefined);
  });
});
