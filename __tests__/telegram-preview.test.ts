import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TelegramPreviewSchema } from "../lib/validation/telegram";

describe("Telegram style preview validation", () => {
  it("accepts trimmed sample text and style", () => {
    const result = TelegramPreviewSchema.safeParse({ text: "  Hello group  ", style: "  Friendly  " });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.text, "Hello group");
      assert.equal(result.data.style, "Friendly");
    }
  });

  it("rejects empty or oversized preview input", () => {
    assert.equal(TelegramPreviewSchema.safeParse({ text: " ", style: "Friendly" }).success, false);
    assert.equal(TelegramPreviewSchema.safeParse({ text: "x".repeat(4001), style: "Friendly" }).success, false);
    assert.equal(TelegramPreviewSchema.safeParse({ text: "Hello", style: "x".repeat(301) }).success, false);
  });
});
