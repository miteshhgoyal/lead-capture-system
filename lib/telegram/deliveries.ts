/**
 * Delivery state machine for Telegram broadcasts. Every transition is a conditional
 * findOneAndUpdate on the current status, so two requests (double click, two tabs, the
 * after() worker and the cron job) can never both act on the same delivery.
 */
import type { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { BotError, rewrite, sendToGroup } from "@/lib/bot";
import { Broadcast } from "@/lib/models/Broadcast";
import { Delivery, type IDelivery } from "@/lib/models/Delivery";
import { Partner } from "@/lib/models/Partner";
import { TelegramGroup } from "@/lib/models/TelegramGroup";
import { DEFAULT_STYLE } from "./styles";

export const APPROVAL_WINDOW_MS = 24 * 3600 * 1000;
/** A `generating` delivery untouched for this long was left behind by a process that died. */
const STUCK_GENERATING_MS = 10 * 60 * 1000;
/** A `sending` delivery can be retried once its last attempt is this old (the bot dedupes on request_id anyway). */
const SEND_LOCK_MS = 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pause between rewrite calls, for the Gemini free-tier per-minute limit. */
export function rewriteDelayMs(): number {
  const n = Number(process.env.TELEGRAM_REWRITE_DELAY_MS);
  return Number.isFinite(n) && n >= 0 ? n : 4500;
}

const approvalCutoff = () => new Date(Date.now() - APPROVAL_WINDOW_MS);
const errCode = (e: unknown) => (e instanceof BotError ? e.code : e instanceof Error ? e.message : "unknown_error").slice(0, 200);

async function rewriteWithRetry(text: string, style: string): Promise<{ text: string; unchanged: boolean }> {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await rewrite(text, style);
      if (typeof r.text !== "string" || !r.text.trim()) throw new BotError(502, "empty_rewrite");
      return { text: r.text, unchanged: r.unchanged === true };
    } catch (e) {
      if (attempt >= 3 || !(e instanceof BotError) || !e.transient || e.code === "bot_not_configured") throw e;
      await sleep(e.status === 429 ? 20_000 * attempt : 3000 * attempt);
    }
  }
}

type Claimed = Pick<IDelivery, "_id" | "broadcastId" | "partnerId" | "style" | "preview" | "pendingSince">;

/** Rewrites a delivery that this caller has already moved to `generating`. */
async function runRewrite(d: Claimed): Promise<{ ok: true; preview: string } | { ok: false; error: string }> {
  let preview: string;
  let version: number;
  try {
    const b = await Broadcast.findById(d.broadcastId).select("text").lean();
    if (!b) throw new Error("broadcast_missing");
    const r = await rewriteWithRetry(b.text, d.style);
    const done = await Delivery.findOneAndUpdate(
      { _id: d._id, status: "generating" },
      {
        $set: {
          status: "pending_approval",
          preview: r.text,
          unchanged: r.unchanged,
          pendingSince: d.pendingSince ?? new Date(),
          generatingSince: null,
          error: null,
          failedStage: null,
        },
        $inc: { version: 1 },
      },
      { returnDocument: "after" }
    ).lean();
    if (!done) return { ok: false, error: "state_changed" };
    preview = r.text;
    version = done.version;
  } catch (e) {
    const error = errCode(e);
    // A regenerate that failed keeps the previous preview so the partner can still approve or reject it.
    const update = d.preview
      ? { $set: { status: "pending_approval", generatingSince: null, error } }
      : { $set: { status: "failed", failedStage: "generate", generatingSince: null, error } };
    await Delivery.updateOne({ _id: d._id, status: "generating" }, update);
    return { ok: false, error };
  }

  const partner = await Partner.findById(d.partnerId).select("telegramAutoApprove").lean();
  if (partner?.telegramAutoApprove) {
    const result = await approveDelivery(String(d._id), d.partnerId, version, { autoApproved: true });
    if (!result.ok) console.error(`[telegram] auto-approval failed for delivery ${d._id}: ${result.error}`);
  }
  return { ok: true, preview };
}

/** Generates the previews of one broadcast, one rewrite at a time with a pause in between. */
export async function generateBroadcast(broadcastId: Types.ObjectId | string): Promise<void> {
  await dbConnect();
  const ids = await Delivery.find({ broadcastId, status: "generating" }).select("_id").sort({ _id: 1 }).lean();
  const delay = rewriteDelayMs();
  for (let i = 0; i < ids.length; i++) {
    if (i > 0) await sleep(delay);
    // Re-claim: touching generatingSince keeps the cron job from picking this one up at the same time.
    const d = await Delivery.findOneAndUpdate(
      { _id: ids[i]._id, status: "generating" },
      { $set: { generatingSince: new Date() } },
      { returnDocument: "after" }
    ).lean();
    if (d) await runRewrite(d);
  }
}

/** Fan-out: one Delivery per active group of an active partner. Previews are generated separately. */
export async function createBroadcast(text: string, createdBy: string): Promise<{ id: string; deliveries: number }> {
  await dbConnect();
  const groups = await TelegramGroup.find({ active: true }).select("_id partnerId").lean();
  const partners = await Partner.find({ _id: { $in: groups.map((g) => g.partnerId) }, isActive: true }).select("_id style").lean();
  const styleOf = new Map(partners.map((p) => [String(p._id), p.style?.trim() || DEFAULT_STYLE]));
  const targets = groups.filter((g) => styleOf.has(String(g.partnerId)));

  const b = await Broadcast.create({ text, createdBy, deliveryCount: targets.length });
  if (targets.length) {
    const now = new Date();
    await Delivery.insertMany(
      targets.map((g) => ({
        broadcastId: b._id,
        groupId: g._id,
        partnerId: g.partnerId,
        style: styleOf.get(String(g.partnerId))!,
        status: "generating",
        generatingSince: now,
      }))
    );
  }
  return { id: String(b._id), deliveries: targets.length };
}

/** Puts a broadcast's failed rewrites back in the queue (send failures are left alone). */
export async function requeueFailedRewrites(broadcastId: string): Promise<number> {
  await dbConnect();
  const r = await Delivery.updateMany(
    { broadcastId, status: "failed", failedStage: "generate" },
    { $set: { status: "generating", generatingSince: new Date(), error: null, failedStage: null } }
  );
  return r.modifiedCount;
}

export type ActionResult = { ok: true; [k: string]: unknown } | { ok: false; status: number; error: string; retryable?: boolean };

export async function regenerateDelivery(id: string, partnerId: Types.ObjectId): Promise<ActionResult> {
  await dbConnect();
  const partner = await Partner.findById(partnerId).select("style").lean();
  const style = partner?.style?.trim() || DEFAULT_STYLE;
  const d = await Delivery.findOneAndUpdate(
    { _id: id, partnerId, status: "pending_approval", pendingSince: { $gte: approvalCutoff() } },
    { $set: { status: "generating", generatingSince: new Date(), style }, $inc: { regenerations: 1 } },
    { returnDocument: "after" }
  ).lean();
  if (!d) return notActionable(id, partnerId);
  const r = await runRewrite(d);
  return r.ok ? { ok: true, preview: r.preview } : { ok: false, status: 502, error: r.error };
}

export async function rejectDelivery(id: string, partnerId: Types.ObjectId): Promise<ActionResult> {
  await dbConnect();
  const d = await Delivery.findOneAndUpdate({ _id: id, partnerId, status: "pending_approval" }, { $set: { status: "rejected" } });
  return d ? { ok: true } : notActionable(id, partnerId);
}

/**
 * Posts the stored preview. `version` must match the preview the partner was shown, so a
 * regenerate in another tab can never cause a text they did not see to be sent.
 * A delivery left in `sending` (timeout, rate limit) can be approved again: the same
 * request_id (the delivery id) makes the bot post it at most once.
 */
export async function approveDelivery(
  id: string,
  partnerId: Types.ObjectId,
  version: number,
  opts: { autoApproved?: boolean; enableAutoApprove?: boolean } = {}
): Promise<ActionResult> {
  await dbConnect();
  const current = await Delivery.findOne({ _id: id, partnerId }).select("status version groupId pendingSince").lean();
  if (!current) return { ok: false, status: 404, error: "not_found" };
  if (current.status === "sent") return { ok: true, alreadySent: true };

  const group = await TelegramGroup.findById(current.groupId).select("chatId active partnerId").lean();
  if (!group || !group.active || String(group.partnerId) !== String(partnerId)) {
    return { ok: false, status: 409, error: "group_disconnected" };
  }

  const now = new Date();
  let claimed: IDelivery | null = null;
  if (current.status === "pending_approval") {
    if (current.version !== version) return { ok: false, status: 409, error: "preview_changed" };
    claimed = await Delivery.findOneAndUpdate(
      { _id: id, partnerId, status: "pending_approval", version, pendingSince: { $gte: approvalCutoff() } },
      {
        $set: {
          status: "sending",
          approvedAt: now,
          sendAttemptAt: now,
          error: null,
          ...(opts.autoApproved ? { autoApproved: true } : {}),
        },
      },
      { returnDocument: "after" }
    ).lean();
  } else if (current.status === "sending") {
    claimed = await Delivery.findOneAndUpdate(
      { _id: id, partnerId, status: "sending", $or: [{ sendAttemptAt: null }, { sendAttemptAt: { $lt: new Date(now.getTime() - SEND_LOCK_MS) } }] },
      { $set: { sendAttemptAt: now } },
      { returnDocument: "after" }
    ).lean();
    if (!claimed) return { ok: false, status: 409, error: "in_progress", retryable: true };
  }
  if (!claimed) return notActionable(id, partnerId);
  if (opts.enableAutoApprove) {
    try {
      const saved = await Partner.updateOne({ _id: partnerId }, { $set: { telegramAutoApprove: true } });
      if (!saved.matchedCount) throw new Error("partner_not_found");
    } catch (e) {
      await Delivery.updateOne(
        { _id: id, partnerId, status: "sending", version },
        { $set: { status: "pending_approval", approvedAt: null, sendAttemptAt: null } }
      );
      throw e;
    }
  }
  if (!claimed.preview) {
    await Delivery.updateOne({ _id: id, status: "sending" }, { $set: { status: "failed", failedStage: "send", error: "no_preview" } });
    return { ok: false, status: 409, error: "no_preview" };
  }

  try {
    const sent = await sendToGroup(group.chatId, claimed.preview, String(claimed._id));
    await Delivery.updateOne(
      { _id: id, status: "sending" },
      { $set: { status: "sent", sentAt: new Date(), telegramMessageId: sent.message_id, error: null } }
    );
    return { ok: true, messageId: sent.message_id };
  } catch (e) {
    const error = errCode(e);
    if (e instanceof BotError && e.transient) {
      // Outcome unknown or deferred: stay in `sending` so the partner can retry with the same request_id.
      await Delivery.updateOne({ _id: id, status: "sending" }, { $set: { error } });
      return { ok: false, status: 502, error, retryable: true };
    }
    await Delivery.updateOne({ _id: id, status: "sending" }, { $set: { status: "failed", failedStage: "send", error } });
    if (e instanceof BotError && (e.status === 403 || e.status === 404)) {
      await TelegramGroup.updateOne({ _id: group._id }, { $set: { active: false, disconnectedAt: new Date(), disconnectReason: error } });
    }
    return { ok: false, status: 502, error };
  }
}

/** Explains why a conditional update matched nothing, expiring the delivery on the way if it is too old. */
async function notActionable(id: string, partnerId: Types.ObjectId): Promise<ActionResult> {
  const d = await Delivery.findOne({ _id: id, partnerId }).select("status pendingSince").lean();
  if (!d) return { ok: false, status: 404, error: "not_found" };
  if (d.status === "pending_approval" && d.pendingSince && d.pendingSince < approvalCutoff()) {
    await Delivery.updateOne({ _id: id, status: "pending_approval" }, { $set: { status: "expired" } });
    return { ok: false, status: 410, error: "expired" };
  }
  return { ok: false, status: 409, error: d.status === "expired" ? "expired" : "not_pending" };
}

/** Marks pending previews older than the approval window as expired. Cheap: safe to call on page load. */
export async function expireStale(): Promise<number> {
  await dbConnect();
  const r = await Delivery.updateMany({ status: "pending_approval", pendingSince: { $lt: approvalCutoff() } }, { $set: { status: "expired" } });
  return r.modifiedCount;
}

/** Previews the partner can still approve (inside the 24h window). */
export async function countPendingApprovals(partnerId: Types.ObjectId): Promise<number> {
  await dbConnect();
  return Delivery.countDocuments({ partnerId, status: "pending_approval", pendingSince: { $gte: approvalCutoff() } });
}

/** Picks up `generating` work a dead process left behind (the after() worker can be killed). */
export async function resumeStuckGeneration(opts: { max: number; budgetMs: number }): Promise<number> {
  await dbConnect();
  const started = Date.now();
  const stuckBefore = () => new Date(Date.now() - STUCK_GENERATING_MS);
  const delay = rewriteDelayMs();
  let done = 0;
  while (done < opts.max && Date.now() - started < opts.budgetMs) {
    if (done > 0) await sleep(delay);
    const d = await Delivery.findOneAndUpdate(
      { status: "generating", generatingSince: { $lt: stuckBefore() } },
      { $set: { generatingSince: new Date() } },
      { sort: { generatingSince: 1 }, returnDocument: "after" }
    ).lean();
    if (!d) break;
    await runRewrite(d);
    done++;
  }
  return done;
}
