import { after } from "next/server";
import { dbConnect } from "@/lib/db";
import { clientIp, hit } from "@/lib/rate-limit";
import { config, signingSecrets } from "./config";
import { safeEqual, sha256, verifyHubSignature } from "./crypto-utils";
import { normalizePayload } from "./normalizer";
import { AutodmWebhookEvent } from "./models";
import { enqueue, processDue } from "./queue";
import { jobHandlers } from "./runner";
import { FeatureGate } from "./settings-store";

const MAX_BODY = 1_000_000;
const ok = (extra: object = {}) => Response.json({ ok: true, ...extra }, { status: 200 });

/** GET: Meta's verification handshake. Works with the master switch off, as long as the verify token is set. */
export async function verifyHandshake(req: Request): Promise<Response> {
  const sp = new URL(req.url).searchParams;
  const token = config().webhookVerifyToken;
  const challenge = sp.get("hub.challenge");
  if (token && sp.get("hub.mode") === "subscribe" && challenge && safeEqual(sp.get("hub.verify_token") ?? "", token)) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: verify the signature on the RAW body, persist each event with a dedupe key, enqueue, answer 200 fast.
 * No heavy work is inline: the queue is drained after the response with `after()`.
 * The route has no session and no CSRF check: the HMAC signature is the authentication.
 */
export async function receive(req: Request): Promise<Response> {
  const raw = await req.text();
  if (raw.length > MAX_BODY) return new Response("Payload too large", { status: 413 });

  const secrets = signingSecrets();
  if (secrets.length === 0) return ok({ ignored: "not_configured" }); // cannot verify anything; never process it
  if (!verifyHubSignature(raw, req.headers.get("x-hub-signature-256"), secrets)) {
    // Count (and cap) rejected requests per IP instead of storing attacker-controlled bodies.
    const r = await hit(`autodm-wh-bad:${clientIp(req)}`, 30, 60);
    console.warn(`[autodm] webhook rejected: invalid signature${r.ok ? "" : " (rate limited)"}`);
    return new Response("Invalid signature", { status: 401 });
  }

  const s = await FeatureGate.all();
  if (s["autodm.enabled"] !== true || s["autodm.webhooks.enabled"] !== true) return ok({ discarded: true });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return ok({ ignored: "invalid_json" });
  }
  const events = normalizePayload(body);
  if (events.length === 0) return ok({ ignored: "no_events" });

  await dbConnect();
  let queued = 0;
  for (const n of events) {
    const dedupeKey = sha256(`${n.platform}:${n.accountExternalId}:${n.kind}:${n.externalEventId}`);
    try {
      const doc = await AutodmWebhookEvent.create({ provider: "meta", dedupeKey, accountExternalId: n.accountExternalId, eventType: n.kind === "ignored" ? `ignored:${n.ignoreReason}` : n.kind, normalized: n, rawPayload: body, signatureValid: true, status: n.kind === "ignored" ? "ignored" : "queued", note: n.ignoreReason, receivedAt: new Date() });
      if (n.kind !== "ignored") {
        await enqueue("process_event", { eventId: String(doc._id) });
        queued++;
      }
    } catch (e) {
      if ((e as { code?: number }).code !== 11000) throw e; // duplicate delivery: already stored
    }
  }
  if (queued > 0) after(async () => void (await processDue(jobHandlers, { max: 20, budgetMs: 20_000 }).catch((e) => console.error("[autodm] drain failed:", e))));
  return ok({ queued });
}
