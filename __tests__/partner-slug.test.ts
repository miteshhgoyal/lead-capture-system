import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { slugify, isReservedSlug, PartnerSchema } from "../lib/validation/partner";

describe("Partner Slug & Validation", () => {
  it("slugifies raw names correctly", () => {
    assert.equal(slugify("Aman Singh"), "aman-singh");
    assert.equal(slugify("   Priya Sharma Trading & FX  "), "priya-sharma-trading-fx");
    assert.equal(slugify("Trader#123_PRO"), "trader123_pro");
  });

  it("identifies reserved system slugs", () => {
    assert.equal(isReservedSlug("admin"), true);
    assert.equal(isReservedSlug("api"), true);
    assert.equal(isReservedSlug("login"), true);
    assert.equal(isReservedSlug("dashboard"), true);
    assert.equal(isReservedSlug("_next"), true);
    assert.equal(isReservedSlug("sitemap"), true);
    assert.equal(isReservedSlug("aman-singh"), false);
  });

  it("validates a full partner schema", () => {
    const valid = {
      name: "Aman Singh",
      slug: "aman-singh",
      telegramLink: "https://t.me/amansingh",
      theme: {
        primaryColor: "#059669",
        secondaryColor: "#10b981",
        accentColor: "#059669",
      },
    };

    const parsed = PartnerSchema.safeParse(valid);
    assert.equal(parsed.success, true);
  });

  it("rejects partner using a reserved slug", () => {
    const invalid = {
      name: "Admin Person",
      slug: "admin",
      telegramLink: "https://t.me/admin",
    };

    const parsed = PartnerSchema.safeParse(invalid);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message.includes("reserved")));
    }
  });
});
