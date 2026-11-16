import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, LeadFormSchema } from "../lib/validation/lead";

describe("Lead Validation & Normalization", () => {
  it("normalizes standard 10-digit Indian numbers to E.164", () => {
    const normalized = normalizePhone("9876543210", "+91");
    assert.equal(normalized, "+919876543210");
  });

  it("handles numbers with spaces, hyphens, and leading zero", () => {
    const normalized = normalizePhone("098765-43210", "+91");
    assert.equal(normalized, "+919876543210");
  });

  it("preserves international numbers already starting with +", () => {
    const normalized = normalizePhone("+1 (555) 123-4567", "+1");
    assert.equal(normalized, "+15551234567");
  });

  it("validates valid lead form payload successfully", () => {
    const payload = {
      name: "Rahul Sharma",
      countryCode: "+91",
      phone: "9876543210",
      capital: "₹1L–₹5L",
      email: "rahul.sharma@gmail.com",
      age: 26,
      profession: "Salaried",
      country: "India",
    };

    const parsed = LeadFormSchema.safeParse(payload);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.name, "Rahul Sharma");
      assert.equal(parsed.data.email, "rahul.sharma@gmail.com");
      assert.equal(parsed.data.age, 26);
    }
  });

  it("rejects invalid email and underage submissions", () => {
    const payload = {
      name: "Rahul",
      countryCode: "+91",
      phone: "9876543210",
      capital: "₹1L–₹5L",
      email: "invalid-email-format",
      age: 16, // Under 18
      profession: "Student",
      country: "India",
    };

    const parsed = LeadFormSchema.safeParse(payload);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((i) => i.path[0]);
      assert.ok(paths.includes("email"));
      assert.ok(paths.includes("age"));
    }
  });

  it("detects honeypot submission", () => {
    const payload = {
      name: "Bot User",
      countryCode: "+91",
      phone: "9876543210",
      capital: "₹1L–₹5L",
      email: "bot@spammer.com",
      age: 25,
      profession: "Student",
      country: "India",
      hp_company: "SpamCorp LLC",
    };

    const parsed = LeadFormSchema.safeParse(payload);
    assert.equal(parsed.success, true);
    // Honeypot is present, server drops it
    assert.equal(parsed.data?.hp_company, "SpamCorp LLC");
  });
});
