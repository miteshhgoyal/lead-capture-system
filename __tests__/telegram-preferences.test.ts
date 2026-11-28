import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Partner } from "../lib/models/Partner";
import { PartnerSelfUpdateSchema } from "../lib/validation/partner-portal";

describe("Telegram auto-approval preference", () => {
  it("defaults to disabled for partners", () => {
    const partner = new Partner({ name: "Test", slug: "test", telegramLink: "https://t.me/test" });
    assert.equal(partner.telegramAutoApprove, false);
  });

  it("accepts a boolean preference and rejects non-boolean values", () => {
    assert.equal(PartnerSelfUpdateSchema.safeParse({ telegramAutoApprove: true }).success, true);
    assert.equal(PartnerSelfUpdateSchema.safeParse({ telegramAutoApprove: "yes" }).success, false);
  });
});
