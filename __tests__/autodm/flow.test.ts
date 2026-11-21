import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePayload } from "../../autodm/normalizer";
import { matchKeyword, normText, pickAutomation, triggersFor } from "../../autodm/matcher";
import { composeDm, fillVariables, validateAutomationContent } from "../../autodm/composer";
import { actionFor, evaluateGuards, triggerFlag, type GuardInput } from "../../autodm/guards";
import { mapGraphError, MetaError } from "../../autodm/errors";
import { defaultSettings, type SettingsMap } from "../../autodm/settings-defs";
import { extractEmail } from "../../autodm/csv";
import type { AutomationLike, TriggerType } from "../../autodm/types";
import * as fx from "./fixtures/webhooks";

const NOW = 1_700_000_000_000;
const DAY = 86400_000;

/* ── normalizer ─────────────────────────────────────────────────────────── */
test("normalizer: comment, dm, story reply, story mention, postback", () => {
  const [c] = normalizePayload(fx.comment);
  assert.equal(c.kind, "comment");
  assert.equal(c.accountExternalId, fx.ACCOUNT);
  assert.equal(c.actorId, fx.USER);
  assert.equal(c.commentId, "c1");
  assert.equal(c.mediaId, "m1");
  assert.equal(c.externalEventId, "c1");
  assert.equal(normalizePayload(fx.dm)[0].kind, "dm");
  assert.equal(normalizePayload(fx.dm)[0].timestamp, 1_700_000_000_000);
  assert.equal(normalizePayload(fx.storyReply)[0].kind, "story_reply");
  assert.equal(normalizePayload(fx.storyMention)[0].kind, "story_mention");
  assert.equal(normalizePayload(fx.postback)[0].kind, "postback");
  assert.equal(normalizePayload(fx.postback)[0].payload, "GET_LINK");
});

test("normalizer: echoes, self-authored events, receipts are ignored (loop prevention)", () => {
  assert.equal(normalizePayload(fx.echo)[0].kind, "ignored");
  assert.equal(normalizePayload(fx.echo)[0].ignoreReason, "echo");
  assert.equal(normalizePayload(fx.selfComment)[0].kind, "ignored");
  assert.equal(normalizePayload(fx.selfComment)[0].ignoreReason, "self_authored");
  assert.equal(normalizePayload(fx.read)[0].kind, "ignored");
});

test("normalizer: facebook comments, unknown objects and junk", () => {
  const [f] = normalizePayload(fx.fbComment);
  assert.equal(f.platform, "facebook");
  assert.equal(f.kind, "comment");
  assert.equal(f.commentId, "fc1");
  assert.deepEqual(normalizePayload(fx.unknownObject), []);
  assert.deepEqual(normalizePayload(null), []);
  assert.deepEqual(normalizePayload("x"), []);
  assert.deepEqual(normalizePayload({ object: "instagram", entry: "nope" }), []);
});

/* ── matcher ────────────────────────────────────────────────────────────── */
const auto = (o: Partial<AutomationLike> & { id: string }): AutomationLike => ({ accountId: "a", status: "active", triggerType: "comment", mediaId: null, keywordList: ["guide"], matchType: "contains", caseSensitive: false, createdAt: new Date(2026, 0, 1), ...o });
const event = (kind: "comment" | "dm" | "story_reply" | "story_mention", text: string, mediaId = "m1") => ({ platform: "instagram" as const, kind, accountExternalId: "x", actorId: "u", text, mediaId, timestamp: NOW, externalEventId: "e" });

test("matcher: keyword rules", () => {
  assert.equal(matchKeyword("Send me the GUIDE!", ["guide"], "contains", false), "guide");
  assert.equal(matchKeyword("Send me the GUIDE!", ["guide"], "contains", true), null);
  assert.equal(matchKeyword("guide", ["guide"], "exact", false), "guide");
  assert.equal(matchKeyword("guide please", ["guide"], "exact", false), null);
  assert.equal(matchKeyword("anything", [], "any", false), "");
  assert.equal(matchKeyword("hello", ["guide"], "contains", false), null);
  assert.equal(matchKeyword("ＧＵＩＤＥ", ["guide"], "contains", false), "guide"); // NFKC
  assert.equal(normText("  A   b ", false), "a b");
  assert.equal(matchKeyword("pricing and price", ["price", "pricing"], "contains", false), "pricing"); // longest wins
});

test("matcher: specific post beats all posts, exact beats contains, at most one", () => {
  const general = auto({ id: "general" });
  const specific = auto({ id: "specific", mediaId: "m1" });
  const other = auto({ id: "other", mediaId: "m2" });
  assert.equal(pickAutomation(event("comment", "guide"), [general, specific, other])?.id, "specific");
  assert.equal(pickAutomation(event("comment", "guide", "m9"), [specific, other]), null);
  assert.equal(pickAutomation(event("comment", "guide", "m9"), [general, specific])?.id, "general");
  const exact = auto({ id: "exact", matchType: "exact" });
  assert.equal(pickAutomation(event("comment", "guide"), [general, exact])?.id, "exact");
  assert.equal(pickAutomation(event("comment", "guide now"), [general, exact])?.id, "general");
});

test("matcher: trigger types, status, schedule window, default DM fallback", () => {
  const story = auto({ id: "s", triggerType: "story_reply", matchType: "any", keywordList: [] });
  const mention = auto({ id: "m", triggerType: "story_mention", matchType: "any", keywordList: ["ignored"] });
  const kw = auto({ id: "k", triggerType: "dm_keyword", keywordList: ["price"] });
  const def = auto({ id: "d", triggerType: "dm_default", matchType: "any", keywordList: [] });
  assert.equal(pickAutomation(event("story_reply", "love it"), [story, kw])?.id, "s");
  assert.equal(pickAutomation(event("story_mention", ""), [mention])?.id, "m");
  assert.equal(pickAutomation(event("dm", "what is the price"), [kw, def])?.id, "k");
  assert.equal(pickAutomation(event("dm", "hello"), [kw, def])?.id, "d");
  assert.equal(pickAutomation(event("dm", "hello"), [kw]), null);
  assert.equal(pickAutomation(event("comment", "guide"), [kw, def]), null);
  assert.equal(pickAutomation(event("comment", "guide"), [auto({ id: "p", status: "paused" })]), null);
  assert.equal(pickAutomation(event("comment", "guide"), [auto({ id: "f", startsAt: new Date(NOW + DAY) })], new Date(NOW)), null);
  assert.equal(pickAutomation(event("comment", "guide"), [auto({ id: "e", endsAt: new Date(NOW - DAY) })], new Date(NOW)), null);
  assert.equal(pickAutomation(event("comment", "guide"), [auto({ id: "w", startsAt: new Date(NOW - DAY), endsAt: new Date(NOW + DAY) })], new Date(NOW))?.id, "w");
  assert.deepEqual(triggersFor("postback"), []);
  assert.deepEqual(triggersFor("ignored"), []);
});

/* ── composer ───────────────────────────────────────────────────────────── */
test("composer: variables only where data exists, limits, buttons", () => {
  assert.equal(fillVariables("Hi {{username}}!", { username: "fan" }), "Hi @fan!");
  assert.equal(fillVariables("Hi {{ username }}!", {}), "Hi there!");
  assert.equal(fillVariables("Hi {{first_name}}", { username: "fan" }), "Hi there");
  const dm = composeDm({ message: "Hello {{username}}", buttons: [{ label: "Open", url: "https://example.com" }, { label: "Bad", url: "http://example.com" }, { label: "Local", url: "https://127.0.0.1" }], username: "fan" });
  assert.equal(dm.text, "Hello @fan");
  assert.equal(dm.buttons.length, 1);
  assert.equal(composeDm({ message: "x".repeat(2000) }).text.length <= 900, true);
  assert.equal(composeDm({ message: "x".repeat(2000), buttons: [{ label: "a", url: "https://example.com" }] }).text.length <= 600, true);
  assert.equal(composeDm({ message: "hi", buttons: Array.from({ length: 6 }, (_, i) => ({ label: `b${i}`, url: "https://example.com" })) }).buttons.length, 3);
  assert.ok(composeDm({ message: "hi", emailPrompt: "Reply with your email" }).text.includes("Reply with your email"));
  assert.equal(composeDm({ message: "a\u0000b\n\n\n\nc" }).text, "ab\n\nc");
});

test("composer: automation validation", () => {
  assert.deepEqual(validateAutomationContent({ dmMessage: "hi", buttons: [], keywordList: ["a"] }).errors, []);
  assert.ok(validateAutomationContent({ dmMessage: "" }).errors.length > 0);
  assert.ok(validateAutomationContent({ dmMessage: "hi", buttons: [{ label: "x", url: "http://bad.com" }] }).errors.length > 0);
  assert.ok(validateAutomationContent({ dmMessage: "hi", buttons: [1, 2, 3, 4].map((n) => ({ label: `b${n}`, url: "https://example.com" })) }).errors.length > 0);
  assert.ok(validateAutomationContent({ dmMessage: "hi", commentReplyVariants: ["x".repeat(400)] }).errors.length > 0);
  assert.ok(validateAutomationContent({ dmMessage: "hi", keywordList: Array.from({ length: 25 }, (_, i) => `k${i}`) }).errors.length > 0);
});

test("leads: e-mail extraction", () => {
  assert.equal(extractEmail("sure, it's Jane.Doe@Example.com thanks"), "jane.doe@example.com");
  assert.equal(extractEmail("no email here"), null);
  assert.equal(extractEmail("a@b"), null);
});

/* ── guards (flag matrix, windows, caps) ─────────────────────────────────── */
const on = (over: Partial<SettingsMap> = {}): SettingsMap => ({ ...defaultSettings(), "autodm.enabled": true, ...over });
const base = (o: Partial<GuardInput> = {}): GuardInput => ({ settings: on(), platform: "instagram", trigger: "comment", action: "private_reply", accountStatus: "active", sentToday: 0, alreadySentToUser: false, sendOncePerUser: true, triggerAt: NOW - 1000, now: NOW, ...o });

test("guards: happy path sends", () => {
  assert.equal(evaluateGuards(base()), null);
  assert.equal(evaluateGuards(base({ trigger: "dm_keyword", action: "dm", lastInboundAt: NOW - 1000 })), null);
});

test("guards: master switch off blocks everything (default settings)", () => {
  assert.equal(evaluateGuards(base({ settings: defaultSettings() })), "skipped_master_disabled");
});

test("guards: every sub-flag off skips with the right reason", () => {
  const cases: [string, Partial<GuardInput>, string][] = [
    ["autodm.instagram.enabled", {}, "skipped_feature_disabled"],
    ["autodm.facebook.enabled", { platform: "facebook" }, "skipped_feature_disabled"], // off by default
    ["autodm.triggers.comment", {}, "skipped_feature_disabled"],
    ["autodm.triggers.story", { trigger: "story_reply", action: "dm", lastInboundAt: NOW }, "skipped_feature_disabled"],
    ["autodm.triggers.story", { trigger: "story_mention", action: "dm", lastInboundAt: NOW }, "skipped_feature_disabled"],
    ["autodm.triggers.dm_keyword", { trigger: "dm_keyword", action: "dm", lastInboundAt: NOW }, "skipped_feature_disabled"],
    ["autodm.triggers.dm_keyword", { trigger: "dm_default", action: "dm", lastInboundAt: NOW }, "skipped_feature_disabled"],
    ["autodm.public_comment_reply.enabled", { action: "public_reply" }, "skipped_feature_disabled"],
    ["autodm.sending.enabled", {}, "skipped_sending_disabled"],
  ];
  for (const [flag, over, expected] of cases) {
    const settings = flag === "autodm.facebook.enabled" ? on() : on({ [flag]: false });
    assert.equal(evaluateGuards(base({ settings, ...over })), expected, `${flag} ${JSON.stringify(over)}`);
  }
});

test("guards: sending kill switch records but never sends, even for public replies", () => {
  const settings = on({ "autodm.sending.enabled": false });
  assert.equal(evaluateGuards(base({ settings })), "skipped_sending_disabled");
  assert.equal(evaluateGuards(base({ settings, action: "public_reply" })), "skipped_sending_disabled");
});

test("guards: account state, daily cap, once per user", () => {
  for (const status of ["token_expired", "revoked", "disabled_by_admin", "error"]) assert.equal(evaluateGuards(base({ accountStatus: status })), "skipped_account_inactive");
  assert.equal(evaluateGuards(base({ sentToday: 1000 })), "skipped_daily_cap");
  assert.equal(evaluateGuards(base({ sentToday: 999 })), null);
  assert.equal(evaluateGuards(base({ settings: on({ "autodm.daily_dm_limit_per_account": 5 }), sentToday: 5 })), "skipped_daily_cap");
  assert.equal(evaluateGuards(base({ alreadySentToUser: true })), "skipped_already_sent");
  assert.equal(evaluateGuards(base({ alreadySentToUser: true, sendOncePerUser: false })), null);
});

test("guards: 7-day private reply window and 24h DM window are enforced", () => {
  assert.equal(evaluateGuards(base({ triggerAt: NOW - 7 * DAY })), null);
  assert.equal(evaluateGuards(base({ triggerAt: NOW - 7 * DAY - 1 })), "skipped_window_expired");
  const dm = base({ trigger: "dm_keyword", action: "dm" });
  assert.equal(evaluateGuards({ ...dm, lastInboundAt: NOW - 24 * 3600_000 }), null);
  assert.equal(evaluateGuards({ ...dm, lastInboundAt: NOW - 24 * 3600_000 - 1 }), "skipped_window_expired");
  assert.equal(evaluateGuards({ ...dm, lastInboundAt: null, triggerAt: NOW - 2 * DAY }), "skipped_window_expired");
  // human-agent tag extends the DM window only when the admin turned it on
  assert.equal(evaluateGuards({ ...dm, lastInboundAt: NOW - 3 * DAY }), "skipped_window_expired");
  assert.equal(evaluateGuards({ ...dm, settings: on({ "autodm.human_agent_tag.enabled": true }), lastInboundAt: NOW - 3 * DAY }), null);
});

test("no cold-DM path: only inbound events map to a send action", () => {
  assert.equal(actionFor("comment"), "private_reply");
  assert.equal(actionFor("dm"), "dm");
  assert.equal(actionFor("story_reply"), "dm");
  assert.equal(actionFor("story_mention"), "dm");
  assert.equal(actionFor("postback"), null);
  assert.equal(actionFor("ignored"), null);
  const triggers: TriggerType[] = ["comment", "story_reply", "story_mention", "dm_keyword", "dm_default"];
  for (const t of triggers) assert.ok(triggerFlag(t).startsWith("autodm.triggers."));
});

/* ── Meta error mapping ─────────────────────────────────────────────────── */
test("errors: Graph error codes map to the internal taxonomy and redact tokens", () => {
  assert.equal(mapGraphError(400, { error: { code: 190, message: "Invalid OAuth access token" } }).kind, "token_invalid");
  assert.equal(mapGraphError(401, {}).kind, "token_invalid");
  assert.equal(mapGraphError(400, { error: { code: 4, message: "rate" } }).kind, "rate_limited");
  assert.equal(mapGraphError(429, {}).kind, "rate_limited");
  assert.equal(mapGraphError(400, { error: { code: 10, message: "perm" } }).kind, "permission_missing");
  assert.equal(mapGraphError(400, { error: { code: 200, message: "perm" } }).kind, "permission_missing");
  assert.equal(mapGraphError(400, { error: { code: 100, error_subcode: 2534014, message: "x" } }).kind, "duplicate_private_reply");
  assert.equal(mapGraphError(400, { error: { code: 10, error_subcode: 2534022, message: "outside of allowed window" } }).kind, "window_expired");
  assert.equal(mapGraphError(400, { error: { code: 551, message: "not available" } }).kind, "user_unreachable");
  assert.equal(mapGraphError(500, {}).kind, "transient");
  assert.equal(mapGraphError(400, { error: { code: 999, message: "?" } }).kind, "unknown");
  const e = mapGraphError(400, { error: { code: 1, message: "failed ?access_token=SECRET123&x=1" } });
  assert.ok(!e.message.includes("SECRET123"));
  assert.equal(new MetaError("transient", "x").retryable, true);
  assert.equal(new MetaError("rate_limited", "x").retryable, true);
  assert.equal(new MetaError("token_invalid", "x").retryable, false);
});
