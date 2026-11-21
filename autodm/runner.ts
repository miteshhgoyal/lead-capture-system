import { dbConnect } from "@/lib/db";
import { BACKOFF_BASE_MS, BACKOFF_MAX_MS, MAX_ATTEMPTS, THROTTLE_MAX_CALLS, THROTTLE_WINDOW_MS } from "./config";
import { composeDm, fillVariables } from "./composer";
import { MetaError } from "./errors";
import { actionFor, evaluateGuards, triggerFlag, type GuardInput } from "./guards";
import { attachEmail, captureLead, extractEmail } from "./leads";
import { trackButtons } from "./links";
import { getMetaClient } from "./meta";
import { pickAutomation } from "./matcher";
import { getAccountToken, markAccount } from "./accounts";
import { AutodmAccount, AutodmAutomation, AutodmConversation, AutodmMessage, AutodmRun, AutodmWebhookEvent, type IAutomation, type IConversation, type IRun } from "./models";
import { enqueue } from "./queue";
import { FeatureGate } from "./settings-store";
import { createBackoffRegistry, createThrottle } from "./throttle";
import type { AutomationLike, NormalizedEvent } from "./types";
import { backoffMs } from "./windows";
import type { Types } from "mongoose";

const throttle = createThrottle(THROTTLE_MAX_CALLS, THROTTLE_WINDOW_MS);
const g = globalThis as unknown as { _autodmBackoff?: ReturnType<typeof createBackoffRegistry> };
const globalBackoff = (g._autodmBackoff ??= createBackoffRegistry());

const EMAIL_PROMPT = "Reply to this message with your email address and we'll send it over.";
const DAY_MS = 24 * 3600 * 1000;
const isDup = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: number }).code === 11000;

async function finishEvent(id: unknown, status: "processed" | "ignored" | "failed", note?: string, error?: string) {
  await AutodmWebhookEvent.updateOne({ _id: id }, { $set: { status, note, error, processedAt: new Date() } });
}

const toLike = (a: IAutomation): AutomationLike => ({ id: String(a._id), accountId: String(a.accountId), status: a.status, triggerType: a.triggerType, mediaId: a.mediaId, keywordList: a.keywordList, matchType: a.matchType, caseSensitive: a.caseSensitive, startsAt: a.startsAt, endsAt: a.endsAt, createdAt: a.createdAt });

/** Job: a stored, normalised webhook event -> (at most one automation) -> runs -> sends. */
export async function processEvent(eventId: string): Promise<void> {
  await dbConnect();
  const ev = await AutodmWebhookEvent.findById(eventId).lean();
  if (!ev || ev.status === "processed" || ev.status === "ignored") return;
  const n = ev.normalized as unknown as NormalizedEvent | undefined;
  if (!n) return finishEvent(ev._id, "ignored", "no_normalized_event");

  const s = await FeatureGate.all();
  if (s["autodm.enabled"] !== true) return finishEvent(ev._id, "ignored", "skipped_master_disabled");
  if (s["autodm.webhooks.enabled"] !== true) return finishEvent(ev._id, "ignored", "skipped_webhooks_disabled");
  if (n.kind === "ignored") return finishEvent(ev._id, "ignored", n.ignoreReason ?? "ignored");
  if (s[`autodm.${n.platform}.enabled`] !== true) return finishEvent(ev._id, "ignored", "skipped_feature_disabled");

  // The account is looked up in OUR database by id. Nothing in the payload is trusted for authorization.
  const account = await AutodmAccount.findOne({ platform: n.platform, externalAccountId: n.accountExternalId }).lean();
  if (!account) return finishEvent(ev._id, "ignored", "unknown_account");
  if (account.status !== "active") return finishEvent(ev._id, "ignored", "account_inactive");

  const trigger = n.kind === "comment" ? "comment" : n.kind === "story_reply" ? "story_reply" : n.kind === "story_mention" ? "story_mention" : n.kind === "dm" ? "dm_keyword" : null;
  if (trigger && s[triggerFlag(trigger)] !== true) return finishEvent(ev._id, "ignored", "skipped_feature_disabled");

  const at = new Date(n.timestamp);
  const dmLike = n.kind === "dm" || n.kind === "story_reply" || n.kind === "story_mention" || n.kind === "postback";
  const conv = await AutodmConversation.findOneAndUpdate(
    { accountId: account._id, externalUserId: n.actorId },
    { $setOnInsert: { ownerId: account.ownerId }, $set: { ...(n.actorUsername ? { username: n.actorUsername } : {}), ...(dmLike ? { lastInboundAt: at, windowExpiresAt: new Date(at.getTime() + DAY_MS) } : {}) } },
    { upsert: true, returnDocument: "after" }
  ).lean<IConversation>();
  if (!conv) return finishEvent(ev._id, "failed", undefined, "conversation_upsert_failed");

  if (n.text || n.messageId) {
    try {
      await AutodmMessage.create({ conversationId: conv._id, ownerId: account.ownerId, direction: "inbound", externalMessageId: n.messageId ?? n.commentId, content: n.text.slice(0, 2000), triggerEventId: ev._id });
    } catch (e) {
      if (!isDup(e)) throw e;
    }
  }

  // A pending e-mail prompt: the next DM from this person is validated and stored.
  if (n.kind === "dm" && conv.awaitingEmailFor) {
    const email = extractEmail(n.text);
    if (email && (await attachEmail(conv, email))) return finishEvent(ev._id, "processed", "email_captured");
  }

  const automations = (await AutodmAutomation.find({ accountId: account._id, status: "active" }).lean()) as IAutomation[];
  const picked = pickAutomation(n, automations.map(toLike));
  if (!picked) return finishEvent(ev._id, "ignored", "no_match");
  const automation = automations.find((a) => String(a._id) === picked.id)!;
  await AutodmAutomation.updateOne({ _id: automation._id }, { $inc: { "stats.triggered": 1 } });

  const main = actionFor(n.kind);
  if (!main) return finishEvent(ev._id, "ignored", "no_send_action");
  const triggerRef = n.commentId ?? n.messageId ?? n.externalEventId;
  const actions: IRun["action"][] = [main];
  if (n.kind === "comment" && automation.commentReplyVariants.length) actions.push("public_reply");

  const runIds: Types.ObjectId[] = [];
  for (const action of actions) {
    try {
      const run = await AutodmRun.create({ automationId: automation._id, accountId: account._id, ownerId: account.ownerId, webhookEventId: ev._id, externalUserId: n.actorId, username: n.actorUsername, triggerRef, triggerType: automation.triggerType, action, status: "pending", triggerAt: at, commentId: n.commentId });
      runIds.push(run._id);
    } catch (e) {
      if (!isDup(e)) throw e; // idempotency: this (automation, trigger, action) already has a run
    }
  }
  for (const id of runIds) {
    const r = await executeRun(String(id));
    if (r.retryInMs) await enqueue("execute_run", { runId: String(id) }, { delayMs: r.retryInMs });
  }
  await finishEvent(ev._id, "processed", runIds.length ? undefined : "duplicate_run");
}

const startOfUtcDay = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Evaluates the guards for one run and, if allowed, sends it. Records exactly one outcome on the run.
 * `replay` re-evaluates a run that was skipped because sending was switched off.
 */
export async function executeRun(runId: string, opts: { replay?: boolean } = {}): Promise<{ retryInMs?: number }> {
  await dbConnect();
  const run = await AutodmRun.findById(runId);
  if (!run || run.status === "sent") return {};
  if (run.status !== "pending" && !(opts.replay && run.status === "skipped_sending_disabled")) return {};

  const [settings, automation, found] = await Promise.all([FeatureGate.all(), AutodmAutomation.findById(run.automationId).lean<IAutomation>(), getAccountToken(run.accountId)]);
  const skip = async (reason: string) => {
    await AutodmRun.updateOne({ _id: run._id }, { $set: { status: reason, skipReason: reason } });
    await AutodmAutomation.updateOne({ _id: run.automationId }, { $inc: { "stats.skipped": 1 } });
    return {};
  };
  if (!automation) return skip("skipped_account_inactive");
  if (!found) return skip("skipped_account_inactive");
  const { account, token } = found;

  const conv = await AutodmConversation.findOne({ accountId: run.accountId, externalUserId: run.externalUserId }).lean<IConversation>();
  const sending = run.action !== "public_reply";
  const [sentToday, sentBefore] = await Promise.all([
    sending ? AutodmRun.countDocuments({ accountId: run.accountId, action: { $in: ["private_reply", "dm"] }, status: "sent", sentAt: { $gte: startOfUtcDay() } }) : 0,
    sending ? AutodmRun.exists({ automationId: run.automationId, externalUserId: run.externalUserId, action: { $in: ["private_reply", "dm"] }, status: "sent", _id: { $ne: run._id } }) : null,
  ]);
  const guard: GuardInput = { settings, platform: account.platform, trigger: automation.triggerType, action: run.action, accountStatus: account.status, sentToday, alreadySentToUser: Boolean(sentBefore), sendOncePerUser: automation.sendOncePerUser, triggerAt: run.triggerAt, lastInboundAt: conv?.lastInboundAt ?? null };
  const reason = evaluateGuards(guard);
  if (reason) return skip(reason);

  const wait = globalBackoff.remaining(String(account._id));
  const gate = throttle.tryAcquire(String(account._id));
  if (wait > 0 || !gate.ok) return { retryInMs: Math.max(wait, gate.retryAfterMs) };

  const client = getMetaClient();
  const attempt = run.attemptCount + 1;
  await AutodmRun.updateOne({ _id: run._id }, { $set: { attemptCount: attempt } });
  try {
    let messageId = "";
    let text = "";
    if (run.action === "public_reply") {
      const variants = automation.commentReplyVariants.filter(Boolean);
      text = fillVariables(variants[Math.floor(Math.random() * variants.length)] ?? "", { username: run.username }).trim();
      if (!text || !run.commentId) return skip("skipped_no_recipient");
      messageId = (await client.replyToComment(account.platform, token, run.commentId, text)).messageId;
    } else {
      const buttons = await trackButtons(automation.dmButtons, { ownerId: account.ownerId, automationId: automation._id, runId: run._id });
      const dm = composeDm({ message: automation.dmMessage, buttons, username: run.username, emailPrompt: automation.captureEmail ? EMAIL_PROMPT : undefined });
      text = dm.text;
      const res = run.action === "private_reply"
        ? await client.sendPrivateReply(account.platform, token, account.externalAccountId, run.commentId ?? run.triggerRef, dm)
        : await client.sendDm(account.platform, token, account.externalAccountId, run.externalUserId, dm, { humanAgent: settings["autodm.human_agent_tag.enabled"] === true });
      messageId = res.messageId;
    }

    await AutodmRun.updateOne({ _id: run._id }, { $set: { status: "sent", sentAt: new Date(), metaResponse: { messageId }, errorCode: undefined, errorMessage: undefined } });
    await AutodmAutomation.updateOne({ _id: automation._id }, { $inc: { "stats.sent": 1, ...(run.action === "public_reply" ? { "stats.replies": 1 } : {}) } });
    if (sending) {
      if (conv) {
        await AutodmConversation.updateOne({ _id: conv._id }, { $set: { lastOutboundAt: new Date(), ...(automation.captureEmail ? { awaitingEmailFor: automation._id } : {}) } });
        try {
          await AutodmMessage.create({ conversationId: conv._id, ownerId: account.ownerId, direction: "outbound", externalMessageId: messageId || undefined, content: text.slice(0, 2000), triggerEventId: run.webhookEventId });
        } catch (e) {
          if (!isDup(e)) throw e;
        }
      }
      if (settings["autodm.leads.enabled"] === true) await captureLead({ account, automation, externalUserId: run.externalUserId, username: run.username });
    }
    return {};
  } catch (e) {
    const err = e instanceof MetaError ? e : new MetaError("unknown", "Unexpected error");
    const fail = async (status: string, extra: Record<string, unknown> = {}) => {
      await AutodmRun.updateOne({ _id: run._id }, { $set: { status, errorCode: err.kind, errorMessage: err.message.slice(0, 300), ...extra } });
      await AutodmAutomation.updateOne({ _id: run.automationId }, { $inc: { [status === "failed" ? "stats.failed" : "stats.skipped"]: 1 } });
      return {};
    };
    switch (err.kind) {
      case "token_invalid":
        await markAccount(account, "token_expired", err.message, `Your @${account.username} connection expired. Reconnect it to resume your automations (they were paused).`);
        return fail("failed");
      case "window_expired":
        return fail("skipped_window_expired", { skipReason: "skipped_window_expired" });
      case "duplicate_private_reply":
        return fail("skipped_already_sent", { skipReason: "skipped_already_sent" });
      case "rate_limited":
      case "transient": {
        const delay = backoffMs(attempt, BACKOFF_BASE_MS, BACKOFF_MAX_MS);
        if (err.kind === "rate_limited") globalBackoff.set(String(account._id), Math.max(delay, 60_000));
        if (attempt >= MAX_ATTEMPTS) return fail("failed");
        await AutodmRun.updateOne({ _id: run._id }, { $set: { errorCode: err.kind, errorMessage: err.message.slice(0, 300) } });
        return { retryInMs: delay };
      }
      case "permission_missing":
        await AutodmAccount.updateOne({ _id: account._id }, { $set: { lastError: `Missing permission: ${err.message}`.slice(0, 300) } });
        return fail("failed");
      default:
        return fail("failed");
    }
  }
}

export const jobHandlers = {
  process_event: async (p: Record<string, unknown>) => {
    await processEvent(String(p.eventId));
  },
  execute_run: async (p: Record<string, unknown>) => executeRun(String(p.runId), { replay: p.replay === true }),
  delete_user_data: async (p: Record<string, unknown>) => {
    const { runDeletion } = await import("./compliance");
    await runDeletion(String(p.code));
  },
};
