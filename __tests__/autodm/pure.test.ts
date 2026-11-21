import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readConfig, signingSecrets } from "../../autodm/config";
import { coerceSetting, defaultSettings, resolveSettings, scopeAllows } from "../../autodm/settings-defs";
import { computeReadiness } from "../../autodm/readiness";
import { decryptToken, encryptToken, VaultError } from "../../autodm/token-vault";
import { makeSignedRequest, parseSignedRequest, safeEqual, signHub, verifyHubSignature } from "../../autodm/crypto-utils";
import { backoffMs, dmAllowed, privateReplyAllowed } from "../../autodm/windows";
import { isSafeHttpsUrl } from "../../autodm/url-safety";
import { csvCell, csvLine } from "../../autodm/csv";
import { redact } from "../../autodm/redact";
import { createBackoffRegistry, createThrottle } from "../../autodm/throttle";
import { matchRoute } from "../../autodm/api/match";

const KEY = "ab".repeat(32);
const HOUR = 3600_000;
const DAY = 24 * HOUR;

test("config: boots with every env empty, honours defaults, never mocks in production", () => {
  const c = readConfig({});
  assert.equal(c.mockMeta, false);
  assert.equal(c.queueName, "autodm");
  assert.ok(c.graphVersion.startsWith("v"));
  assert.ok(c.instagramScopes.includes("instagram_business_manage_messages"));
  assert.equal(readConfig({ AUTODM_MOCK_META: "true" }).mockMeta, true);
  assert.equal(readConfig({ AUTODM_MOCK_META: "true", NODE_ENV: "production" }).mockMeta, false);
  assert.deepEqual(signingSecrets(readConfig({})), []);
  assert.deepEqual(signingSecrets(readConfig({ META_APP_SECRET: "a", INSTAGRAM_APP_SECRET: "b" })), ["b", "a"]);
});

test("settings: defaults match the spec and master is OFF", () => {
  const d = defaultSettings();
  assert.equal(d["autodm.enabled"], false);
  assert.equal(d["autodm.facebook.enabled"], false);
  assert.equal(d["autodm.instagram.enabled"], true);
  assert.equal(d["autodm.sending.enabled"], true);
  assert.equal(d["autodm.max_accounts_per_user"], 3);
  assert.equal(d["autodm.max_active_automations_per_account"], 20);
  assert.equal(d["autodm.daily_dm_limit_per_account"], 1000);
  assert.equal(d["autodm.allowed_user_scope"], "all");
  assert.deepEqual(d["autodm.allowlist_user_ids"], []);
});

test("settings: coercion validates types, ranges and ids", () => {
  assert.equal(coerceSetting("autodm.enabled", "true").ok, false);
  assert.deepEqual(coerceSetting("autodm.enabled", true), { ok: true, value: true });
  assert.equal(coerceSetting("autodm.max_accounts_per_user", 0).ok, false);
  assert.equal(coerceSetting("autodm.max_accounts_per_user", 1.5).ok, false);
  assert.deepEqual(coerceSetting("autodm.max_accounts_per_user", "5"), { ok: true, value: 5 });
  assert.equal(coerceSetting("autodm.allowed_user_scope", "everyone").ok, false);
  assert.equal(coerceSetting("autodm.allowlist_user_ids", ["nope"]).ok, false);
  assert.equal(coerceSetting("autodm.nope", true).ok, false);
  const ids = coerceSetting("autodm.allowlist_user_ids", ["a".repeat(24), "a".repeat(24)]);
  assert.ok(ids.ok && (ids.value as string[]).length === 1);
  // invalid stored values fall back to the default
  assert.equal(resolveSettings([{ key: "autodm.enabled", value: "yes" }])["autodm.enabled"], false);
  assert.equal(resolveSettings([{ key: "autodm.enabled", value: true }])["autodm.enabled"], true);
});

test("scope: all / admins_only / allowlist", () => {
  assert.equal(scopeAllows("all", [], { id: "u" }), true);
  assert.equal(scopeAllows("admins_only", [], { id: "u" }), false);
  assert.equal(scopeAllows("admins_only", [], { id: "u", isAdmin: true }), true);
  assert.equal(scopeAllows("allowlist", ["u"], { id: "u" }), true);
  assert.equal(scopeAllows("allowlist", ["x"], { id: "u" }), false);
});

test("readiness: lists missing envs, blocks until complete, never returns values", () => {
  const empty = computeReadiness(readConfig({}), {});
  assert.equal(empty.ready, false);
  assert.ok(empty.missing.some((m) => m.key === "APP_ENCRYPTION_KEY"));
  assert.ok(!JSON.stringify(empty).includes("secret-value"));
  const env = { MONGODB_URI: "mongodb://x", APP_ENCRYPTION_KEY: KEY, META_APP_SECRET: "secret-value", META_APP_ID: "1", META_WEBHOOK_VERIFY_TOKEN: "t", INSTAGRAM_REDIRECT_URI: "https://x/cb", NEXT_PUBLIC_SITE_URL: "https://x" };
  const full = computeReadiness(readConfig(env), env);
  assert.equal(full.ready, true);
  assert.ok(!JSON.stringify(full).includes("secret-value"));
  // a malformed encryption key is "missing"
  const bad = { ...env, APP_ENCRYPTION_KEY: "short" };
  assert.equal(computeReadiness(readConfig(bad), bad).ready, false);
  // mock mode needs far less
  const mockEnv = { MONGODB_URI: "m", APP_ENCRYPTION_KEY: KEY, META_APP_SECRET: "x", AUTODM_MOCK_META: "true" };
  assert.equal(computeReadiness(readConfig(mockEnv), mockEnv).ready, true);
});

test("token vault: roundtrip, random IV, tamper detection, wrong key, bad key", () => {
  const a = encryptToken("IGQ-secret-token", KEY);
  const b = encryptToken("IGQ-secret-token", KEY);
  assert.notEqual(a, b);
  assert.ok(a.startsWith("v1."));
  assert.ok(!a.includes("IGQ-secret-token"));
  assert.equal(decryptToken(a, KEY), "IGQ-secret-token");
  const parts = a.split(".");
  parts[3] = Buffer.from("tampered").toString("base64url");
  assert.throws(() => decryptToken(parts.join("."), KEY), VaultError);
  assert.throws(() => decryptToken(a, "cd".repeat(32)), VaultError);
  assert.throws(() => encryptToken("x", "nothex"), VaultError);
  assert.throws(() => decryptToken("v9.a.b.c", KEY), VaultError);
  try { decryptToken(a, "cd".repeat(32)); } catch (e) { assert.ok(!String((e as Error).message).includes("IGQ")); }
});

test("webhook signature: valid, invalid, missing, wrong prefix, rotated secret", () => {
  const body = '{"object":"instagram"}';
  const good = signHub(body, "s3cret");
  assert.equal(verifyHubSignature(body, good, ["s3cret"]), true);
  assert.equal(verifyHubSignature(body, good, ["other", "s3cret"]), true);
  assert.equal(verifyHubSignature(body + " ", good, ["s3cret"]), false);
  assert.equal(verifyHubSignature(body, "sha256=00", ["s3cret"]), false);
  assert.equal(verifyHubSignature(body, null, ["s3cret"]), false);
  assert.equal(verifyHubSignature(body, undefined, ["s3cret"]), false);
  assert.equal(verifyHubSignature(body, good.replace("sha256=", "sha1="), ["s3cret"]), false);
  assert.equal(verifyHubSignature(body, good, []), false);
  assert.equal(good, `sha256=${createHmac("sha256", "s3cret").update(body).digest("hex")}`);
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});

test("signed_request parsing", () => {
  const sr = makeSignedRequest({ user_id: "123", algorithm: "HMAC-SHA256" }, "s3cret");
  assert.deepEqual(parseSignedRequest(sr, ["s3cret"])?.user_id, "123");
  assert.equal(parseSignedRequest(sr, ["wrong"]), null);
  assert.equal(parseSignedRequest("garbage", ["s3cret"]), null);
  assert.equal(parseSignedRequest("", ["s3cret"]), null);
  const [sig, payload] = sr.split(".");
  const forged = Buffer.from(JSON.stringify({ user_id: "999" })).toString("base64url");
  assert.equal(parseSignedRequest(`${sig}.${forged}`, ["s3cret"]), null);
  assert.ok(payload);
});

test("windows: 7-day private reply and 24h DM boundaries", () => {
  const now = 1_000_000_000_000;
  assert.equal(privateReplyAllowed(now - 7 * DAY, now), true);
  assert.equal(privateReplyAllowed(now - 7 * DAY - 1, now), false);
  assert.equal(privateReplyAllowed(now + 1000, now), false); // future timestamp
  assert.equal(dmAllowed(now - 24 * HOUR, now), true);
  assert.equal(dmAllowed(now - 24 * HOUR - 1, now), false);
  assert.equal(dmAllowed(null, now), false); // never a cold DM
  assert.equal(dmAllowed(undefined, now), false);
  assert.equal(dmAllowed(now - 3 * DAY, now), false);
  assert.equal(dmAllowed(now - 3 * DAY, now, true), true); // human agent tag
  assert.equal(dmAllowed(now - 7 * DAY - 1, now, true), false);
});

test("backoff: exponential with jitter, capped", () => {
  assert.equal(backoffMs(1, 1000, 60000, () => 0), 500);
  assert.equal(backoffMs(1, 1000, 60000, () => 1), 1000);
  assert.equal(backoffMs(3, 1000, 60000, () => 1), 4000);
  assert.equal(backoffMs(20, 1000, 60000, () => 1), 60000);
});

test("url safety: https only, no private/local targets", () => {
  for (const ok of ["https://example.com/a?b=1", "https://sub.example.co.uk", "https://t.me/channel"]) assert.equal(isSafeHttpsUrl(ok), true, ok);
  for (const bad of ["http://example.com", "javascript:alert(1)", "https://localhost/x", "https://127.0.0.1", "https://10.0.0.5", "https://192.168.1.1", "https://172.16.0.1", "https://169.254.169.254/latest", "https://100.64.0.1", "https://[::1]/", "https://intranet", "https://user:pw@example.com", "https://x.internal", "https://printer.local", "not a url", "", "ftp://example.com"]) assert.equal(isSafeHttpsUrl(bad), false, bad);
});

test("csv: formula injection is neutralised and quotes escaped", () => {
  assert.equal(csvCell("=HYPERLINK(\"x\")"), '"\'=HYPERLINK(""x"")"');
  for (const c of ["+1", "-1", "@SUM(A1)", "\tx"]) assert.ok(csvCell(c).startsWith("\"'"), c);
  assert.equal(csvCell("plain"), '"plain"');
  assert.equal(csvCell(null), '""');
  assert.equal(csvLine(["a", 'b"c']), '"a","b""c"');
});

test("redact: tokens and e-mails never reach admin screens", () => {
  const r = redact({ access_token: "abc", nested: { Authorization: "Bearer x", text: "mail me at jane.doe@example.com" }, list: [{ client_secret: "s" }] }) as Record<string, any>;
  assert.equal(r.access_token, "[redacted]");
  assert.equal(r.nested.Authorization, "[redacted]");
  assert.ok(!r.nested.text.includes("jane.doe@example.com"));
  assert.equal(r.list[0].client_secret, "[redacted]");
});

test("throttle: sliding window and global backoff", () => {
  const t = createThrottle(2, 1000);
  assert.equal(t.tryAcquire("a", 0).ok, true);
  assert.equal(t.tryAcquire("a", 100).ok, true);
  const third = t.tryAcquire("a", 200);
  assert.equal(third.ok, false);
  assert.ok(third.retryAfterMs > 0);
  assert.equal(t.tryAcquire("b", 200).ok, true);
  assert.equal(t.tryAcquire("a", 1100).ok, true);
  const b = createBackoffRegistry();
  b.set("acc", 5000, 0);
  assert.equal(b.remaining("acc", 1000), 4000);
  assert.equal(b.remaining("acc", 6000), 0);
});

test("router matcher: params, methods and length", () => {
  const routes = [{ method: "GET", path: "automations/:id" }, { method: "POST", path: "automations/:id/activate" }, { method: "GET", path: "accounts" }];
  assert.equal(matchRoute(routes, "GET", ["automations", "abc"])?.params.id, "abc");
  assert.equal(matchRoute(routes, "POST", ["automations", "abc", "activate"])?.params.id, "abc");
  assert.equal(matchRoute(routes, "DELETE", ["automations", "abc"]), null);
  assert.equal(matchRoute(routes, "GET", ["accounts", "x"]), null);
  assert.equal(matchRoute(routes, "GET", []), null);
});
