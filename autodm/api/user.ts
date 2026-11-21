import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { fail, json, readJson } from "@/lib/http";
import { hit } from "@/lib/rate-limit";
import { MAX_BUTTON_LABEL, MAX_BUTTONS, MAX_COMMENT_REPLY, MAX_KEYWORD_LEN, MAX_KEYWORDS, config, signingSecrets } from "../config";
import { completeConnect, disconnectAccount, getAccountToken, publicAccount, startConnect } from "../accounts";
import { composeDm, validateAutomationContent } from "../composer";
import { csvLine } from "../csv";
import { safeEqual } from "../crypto-utils";
import { triggerFlag, evaluateGuards } from "../guards";
import { LEAD_CSV_HEADER } from "../leads";
import { getMetaClient } from "../meta";
import { AutodmAccount, AutodmAutomation, AutodmConversation, AutodmLead, AutodmLinkClick, AutodmMessage, AutodmNotification, AutodmRun, type IAccount, type IAutomation } from "../models";
import { handleDataDeletion, handleDeauthorize } from "../compliance";
import { FeatureGate, GateError } from "../settings-store";
import { runScheduled } from "../scheduled";
import { idParam, pageParams, type Route } from "./router";

const Oid = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");
const date = (v: unknown): Date | null => {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const AutomationInput = z.object({
  accountId: Oid,
  name: z.string().trim().min(1, "Give the automation a name").max(80),
  triggerType: z.enum(["comment", "story_reply", "story_mention", "dm_keyword", "dm_default"]),
  mediaId: z.string().trim().max(100).nullish(),
  mediaPermalink: z.string().trim().max(500).optional(),
  mediaThumbnail: z.string().trim().max(1000).optional(),
  keywordList: z.array(z.string().trim().min(1).max(MAX_KEYWORD_LEN)).max(MAX_KEYWORDS).default([]),
  matchType: z.enum(["contains", "exact", "any"]).default("contains"),
  caseSensitive: z.boolean().default(false),
  dmMessage: z.string().max(2000).default(""),
  dmButtons: z.array(z.object({ label: z.string().trim().min(1).max(MAX_BUTTON_LABEL), url: z.string().trim().max(500) })).max(MAX_BUTTONS).default([]),
  commentReplyVariants: z.array(z.string().trim().min(1).max(MAX_COMMENT_REPLY)).max(5).default([]),
  sendOncePerUser: z.boolean().default(true),
  captureEmail: z.boolean().default(false),
  startsAt: z.string().nullish(),
  endsAt: z.string().nullish(),
});

/** Cross-field rules shared by create/update/activate. Returns an error message or null. */
function contentProblem(a: z.infer<typeof AutomationInput> | IAutomation): string | null {
  const anyMatch = a.triggerType === "dm_default" || a.triggerType === "story_mention" || a.matchType === "any";
  if (!anyMatch && a.keywordList.length === 0) return "Add at least one keyword, or choose “any message”.";
  const issues = validateAutomationContent({ dmMessage: a.dmMessage, buttons: "dmButtons" in a ? a.dmButtons : [], commentReplyVariants: a.commentReplyVariants, keywordList: a.keywordList });
  return issues.errors[0] ?? null;
}

async function assertAutomationAllowed(a: { triggerType: IAutomation["triggerType"]; commentReplyVariants: string[] }, account: Pick<IAccount, "platform">) {
  const s = await FeatureGate.all();
  if (s[`autodm.${account.platform}.enabled`] !== true) throw new GateError(403, `${account.platform === "instagram" ? "Instagram" : "Facebook"} automations are currently disabled by the administrator.`);
  if (s[triggerFlag(a.triggerType)] !== true) throw new GateError(403, "This trigger type is currently disabled by the administrator.");
  if (a.commentReplyVariants.length > 0 && s["autodm.public_comment_reply.enabled"] !== true) throw new GateError(403, "Public comment replies are currently disabled by the administrator.");
}

const view = (a: IAutomation) => ({ id: String(a._id), accountId: String(a.accountId), name: a.name, status: a.status, triggerType: a.triggerType, mediaId: a.mediaId ?? null, mediaPermalink: a.mediaPermalink ?? null, mediaThumbnail: a.mediaThumbnail ?? null, keywordList: a.keywordList, matchType: a.matchType, caseSensitive: a.caseSensitive, dmMessage: a.dmMessage, dmButtons: a.dmButtons, commentReplyVariants: a.commentReplyVariants, sendOncePerUser: a.sendOncePerUser, captureEmail: a.captureEmail, startsAt: a.startsAt ?? null, endsAt: a.endsAt ?? null, stats: a.stats, pausedReason: a.pausedReason ?? null, createdAt: a.createdAt, updatedAt: a.updatedAt });

async function ownedAccount(ownerId: string, id: string | undefined) {
  const oid = idParam(id);
  if (!oid) throw new GateError(400, "Invalid id");
  await dbConnect();
  const a = await AutodmAccount.findOne({ _id: oid, ownerId }).lean<IAccount>();
  if (!a) throw new GateError(404, "Account not found");
  return a;
}
async function ownedAutomation(ownerId: string, id: string | undefined) {
  const oid = idParam(id);
  if (!oid) throw new GateError(400, "Invalid id");
  await dbConnect();
  const a = await AutodmAutomation.findOne({ _id: oid, ownerId }).lean<IAutomation>();
  if (!a) throw new GateError(404, "Automation not found");
  return a;
}

function normalizeInput(i: z.infer<typeof AutomationInput>) {
  const anyMatch = i.triggerType === "dm_default" || i.triggerType === "story_mention";
  return {
    ...i,
    mediaId: i.triggerType === "comment" ? i.mediaId || null : null,
    matchType: anyMatch ? ("any" as const) : i.matchType,
    keywordList: anyMatch || i.matchType === "any" ? [] : [...new Set(i.keywordList)],
    startsAt: date(i.startsAt),
    endsAt: date(i.endsAt),
  };
}

const mediaCache = new Map<string, { at: number; data: unknown }>();

async function activeCount(accountId: unknown, exceptId?: unknown) {
  return AutodmAutomation.countDocuments({ accountId, status: "active", ...(exceptId ? { _id: { $ne: exceptId } } : {}) });
}

export const userRoutes: Route[] = [
  // ── features / notifications ──
  {
    method: "GET", path: "features", auth: "partner",
    handler: async () => {
      const s = await FeatureGate.all();
      return json({ ok: true, features: { instagram: s["autodm.instagram.enabled"], facebook: s["autodm.facebook.enabled"], oauth: s["autodm.oauth.enabled"], triggers: { comment: s["autodm.triggers.comment"], story: s["autodm.triggers.story"], dm_keyword: s["autodm.triggers.dm_keyword"] }, publicReply: s["autodm.public_comment_reply.enabled"], leads: s["autodm.leads.enabled"], analytics: s["autodm.analytics.enabled"], sending: s["autodm.sending.enabled"], limits: { maxAccounts: s["autodm.max_accounts_per_user"], maxActivePerAccount: s["autodm.max_active_automations_per_account"], dailyDmCap: s["autodm.daily_dm_limit_per_account"] }, mock: config().mockMeta } });
    },
  },
  {
    method: "GET", path: "notifications", auth: "partner",
    handler: async (c) => {
      await dbConnect();
      const items = await AutodmNotification.find({ ownerId: c.ownerId }).sort({ createdAt: -1 }).limit(20).lean();
      return json({ ok: true, notifications: items.map((n) => ({ id: String(n._id), kind: n.kind, message: n.message, read: Boolean(n.readAt), createdAt: n.createdAt })) });
    },
  },
  {
    method: "POST", path: "notifications/read", auth: "partner",
    handler: async (c) => {
      await dbConnect();
      await AutodmNotification.updateMany({ ownerId: c.ownerId, readAt: null }, { $set: { readAt: new Date() } });
      return json({ ok: true });
    },
  },

  // ── accounts / OAuth ──
  {
    method: "GET", path: "accounts", auth: "partner",
    handler: async (c) => {
      await dbConnect();
      const accounts = await AutodmAccount.find({ ownerId: c.ownerId, status: { $ne: "revoked" } }).sort({ connectedAt: -1 }).lean<IAccount[]>();
      const counts = await AutodmAutomation.aggregate([{ $match: { ownerId: c.ownerId, status: "active" } }, { $group: { _id: "$accountId", n: { $sum: 1 } } }]);
      const byAcc = new Map(counts.map((x) => [String(x._id), x.n as number]));
      return json({ ok: true, accounts: accounts.map((a) => ({ ...publicAccount(a), activeAutomations: byAcc.get(String(a._id)) ?? 0 })) });
    },
  },
  {
    method: "GET", path: "connect/:platform", auth: "partner",
    handler: async (c) => {
      const platform = c.params.platform;
      if (platform !== "instagram" && platform !== "facebook") return fail(404, "Not found");
      const rl = await hit(`autodm-oauth:${c.ip}`, 10, 60);
      if (!rl.ok) return fail(429, "Too many attempts. Wait a minute and try again.");
      const url = await startConnect(c.ownerId, platform);
      return Response.redirect(url.startsWith("/") ? new URL(url, c.req.url).toString() : url, 302);
    },
  },
  {
    method: "GET", path: "oauth/callback", auth: "partner",
    handler: async (c) => {
      const r = await completeConnect(c.ownerId, { code: c.sp.get("code"), state: c.sp.get("state"), error: c.sp.get("error") ?? c.sp.get("error_reason") });
      const to = r.ok ? "/autodm/connected" : `/autodm/error?code=${encodeURIComponent(r.code)}`;
      return Response.redirect(new URL(to, c.req.url).toString(), 302);
    },
  },
  {
    method: "DELETE", path: "accounts/:id", auth: "partner",
    handler: async (c) => {
      const a = await ownedAccount(c.ownerId, c.params.id);
      await disconnectAccount(a._id, "revoked");
      return json({ ok: true });
    },
  },
  {
    method: "GET", path: "media", auth: "partner",
    handler: async (c) => {
      const a = await ownedAccount(c.ownerId, c.sp.get("accountId") ?? undefined);
      const after = c.sp.get("after") ?? "";
      const key = `${a._id}:${after}`;
      const hit1 = mediaCache.get(key);
      if (hit1 && Date.now() - hit1.at < 60_000) return json(hit1.data as object);
      const found = await getAccountToken(a._id);
      if (!found || a.status !== "active") throw new GateError(409, "This account needs to be reconnected.");
      const r = await getMetaClient().listMedia(a.platform, found.token, a.externalAccountId, { after: after || undefined, limit: 24 });
      const data = { ok: true, items: r.items, next: r.next ?? null };
      mediaCache.set(key, { at: Date.now(), data });
      return json(data);
    },
  },

  // ── automations ──
  {
    method: "GET", path: "automations", auth: "partner",
    handler: async (c) => {
      await dbConnect();
      const [list, accounts] = await Promise.all([AutodmAutomation.find({ ownerId: c.ownerId }).sort({ createdAt: -1 }).limit(500).lean<IAutomation[]>(), AutodmAccount.find({ ownerId: c.ownerId }).select("username platform").lean()]);
      const acc = new Map(accounts.map((a) => [String(a._id), a]));
      return json({ ok: true, automations: list.map((a) => ({ ...view(a), account: acc.get(String(a.accountId)) ? { username: acc.get(String(a.accountId))!.username, platform: acc.get(String(a.accountId))!.platform } : null })) });
    },
  },
  {
    method: "POST", path: "automations", auth: "partner",
    handler: async (c) => {
      const input = normalizeInput(AutomationInput.parse(await readJson(c.req)));
      const account = await ownedAccount(c.ownerId, input.accountId);
      if (account.status === "revoked") throw new GateError(409, "This account is disconnected.");
      await assertAutomationAllowed(input, account);
      const problem = contentProblem(input);
      if (problem) throw new GateError(400, problem);
      if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) throw new GateError(400, "The end date must be after the start date.");
      const doc = await AutodmAutomation.create({ ...input, ownerId: c.ownerId, accountId: account._id, status: "draft" });
      return json({ ok: true, automation: view(doc.toObject() as IAutomation) }, 201);
    },
  },
  {
    method: "GET", path: "automations/:id", auth: "partner",
    handler: async (c) => json({ ok: true, automation: view(await ownedAutomation(c.ownerId, c.params.id)) }),
  },
  {
    method: "PUT", path: "automations/:id", auth: "partner",
    handler: async (c) => {
      const current = await ownedAutomation(c.ownerId, c.params.id);
      const input = normalizeInput(AutomationInput.parse(await readJson(c.req)));
      if (String(current.accountId) !== input.accountId) throw new GateError(400, "The account of an automation cannot be changed.");
      const account = await ownedAccount(c.ownerId, input.accountId);
      await assertAutomationAllowed(input, account);
      const problem = contentProblem(input);
      if (problem) throw new GateError(400, problem);
      if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) throw new GateError(400, "The end date must be after the start date.");
      const { accountId: _a, ...rest } = input;
      void _a;
      const doc = await AutodmAutomation.findOneAndUpdate({ _id: current._id, ownerId: c.ownerId }, { $set: rest }, { returnDocument: "after" }).lean<IAutomation>();
      return json({ ok: true, automation: view(doc!) });
    },
  },
  {
    method: "DELETE", path: "automations/:id", auth: "partner",
    handler: async (c) => {
      const a = await ownedAutomation(c.ownerId, c.params.id);
      await AutodmAutomation.deleteOne({ _id: a._id, ownerId: c.ownerId });
      return json({ ok: true });
    },
  },
  {
    method: "POST", path: "automations/:id/activate", auth: "partner",
    handler: async (c) => {
      const a = await ownedAutomation(c.ownerId, c.params.id);
      const account = await ownedAccount(c.ownerId, String(a.accountId));
      if (account.status !== "active") throw new GateError(409, "Reconnect this Instagram/Facebook account before activating automations.");
      await assertAutomationAllowed(a, account);
      const problem = contentProblem(a);
      if (problem) throw new GateError(400, problem);
      const s = await FeatureGate.all();
      if ((await activeCount(a.accountId, a._id)) >= Number(s["autodm.max_active_automations_per_account"])) throw new GateError(409, `You can have up to ${s["autodm.max_active_automations_per_account"]} active automations per account.`);
      await AutodmAutomation.updateOne({ _id: a._id }, { $set: { status: "active", pausedReason: undefined } });
      return json({ ok: true });
    },
  },
  {
    method: "POST", path: "automations/:id/pause", auth: "partner",
    handler: async (c) => {
      const a = await ownedAutomation(c.ownerId, c.params.id);
      await AutodmAutomation.updateOne({ _id: a._id }, { $set: { status: "paused", pausedReason: "user" } });
      return json({ ok: true });
    },
  },
  {
    // Dry run + (optionally) one real DM to a person who messaged this account in the last 24h. Never a cold DM.
    method: "POST", path: "automations/:id/test", auth: "partner",
    handler: async (c) => {
      const a = await ownedAutomation(c.ownerId, c.params.id);
      const account = await ownedAccount(c.ownerId, String(a.accountId));
      const body = z.object({ conversationId: Oid.optional() }).parse((await readJson(c.req)) ?? {});
      const dm = composeDm({ message: a.dmMessage, buttons: a.dmButtons, username: "preview_user", emailPrompt: a.captureEmail ? "Reply with your email address and we'll send it over." : undefined });
      const checks: { ok: boolean; text: string }[] = [];
      const problem = contentProblem(a);
      checks.push({ ok: !problem, text: problem ?? "Message, buttons and keywords are valid." });
      checks.push({ ok: account.status === "active", text: account.status === "active" ? "Account is connected." : `Account status: ${account.status}.` });
      const s = await FeatureGate.all();
      checks.push({ ok: s["autodm.sending.enabled"] === true, text: s["autodm.sending.enabled"] === true ? "Sending is enabled." : "Sending is currently switched off by the administrator." });
      let sent = false;
      if (body.conversationId) {
        const conv = await AutodmConversation.findOne({ _id: body.conversationId, ownerId: c.ownerId, accountId: a.accountId }).lean();
        if (!conv) throw new GateError(404, "Conversation not found");
        const reason = evaluateGuards({ settings: s, platform: account.platform, trigger: "dm_keyword", action: "dm", accountStatus: account.status, sentToday: 0, alreadySentToUser: false, sendOncePerUser: false, triggerAt: conv.lastInboundAt ?? 0, lastInboundAt: conv.lastInboundAt ?? null });
        checks.push({ ok: !reason, text: reason ? `Cannot send the test: ${reason.replace("skipped_", "").replace(/_/g, " ")} (a DM needs a message from this person in the last 24 hours).` : "The person messaged you in the last 24 hours, so a reply is allowed." });
        const found = await getAccountToken(a.accountId);
        if (!reason && !problem && found) {
          await getMetaClient().sendDm(account.platform, found.token, account.externalAccountId, conv.externalUserId, dm);
          sent = true;
        }
      }
      return json({ ok: true, preview: dm, checks, sent });
    },
  },

  // ── leads / conversations / analytics ──
  {
    method: "GET", path: "leads", auth: "partner", flag: "autodm.leads.enabled",
    handler: async (c) => {
      const { filter, page, limit } = leadFilter(c.ownerId, c.sp);
      const [total, rows] = await Promise.all([AutodmLead.countDocuments(filter), AutodmLead.find(filter).sort({ capturedAt: -1 }).skip((page - 1) * limit).limit(limit).lean()]);
      const [autos, accounts] = await Promise.all([AutodmAutomation.find({ ownerId: c.ownerId }).select("name").lean(), AutodmAccount.find({ ownerId: c.ownerId }).select("username").lean()]);
      const an = new Map(autos.map((x) => [String(x._id), x.name]));
      const acn = new Map(accounts.map((x) => [String(x._id), x.username]));
      return json({ ok: true, leads: rows.map((l) => ({ id: String(l._id), username: l.username ?? "", externalUserId: l.externalUserId, email: l.email ?? "", source: l.source, capturedAt: l.capturedAt, automation: an.get(String(l.automationId)) ?? "", account: acn.get(String(l.accountId)) ?? "" })), pagination: { page, limit, total } });
    },
  },
  {
    method: "GET", path: "leads/export", auth: "partner", flag: "autodm.leads.enabled",
    handler: async (c) => {
      const { filter } = leadFilter(c.ownerId, c.sp);
      const rows = await AutodmLead.find(filter).sort({ capturedAt: -1 }).limit(20000).lean();
      const [autos, accounts] = await Promise.all([AutodmAutomation.find({ ownerId: c.ownerId }).select("name").lean(), AutodmAccount.find({ ownerId: c.ownerId }).select("username").lean()]);
      const an = new Map(autos.map((x) => [String(x._id), x.name]));
      const acn = new Map(accounts.map((x) => [String(x._id), x.username]));
      const lines = rows.map((l) => csvLine([l.capturedAt.toISOString(), acn.get(String(l.accountId)) ?? "", l.username ?? "", l.externalUserId, l.email ?? "", l.source, an.get(String(l.automationId)) ?? ""]));
      return new Response("﻿" + csvLine(LEAD_CSV_HEADER) + "\n" + lines.join("\n"), { status: 200, headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="autodm_leads_${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" } });
    },
  },
  {
    method: "GET", path: "conversations", auth: "partner",
    handler: async (c) => {
      await dbConnect();
      const { page, limit, skip } = pageParams(c.sp, 50);
      const filter: Record<string, unknown> = { ownerId: c.ownerId };
      const q = (c.sp.get("q") ?? "").trim().slice(0, 40);
      if (q) filter.username = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      const [total, rows] = await Promise.all([AutodmConversation.countDocuments(filter), AutodmConversation.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean()]);
      const now = Date.now();
      return json({ ok: true, conversations: rows.map((r) => ({ id: String(r._id), username: r.username ?? "", externalUserId: r.externalUserId, lastInboundAt: r.lastInboundAt ?? null, lastOutboundAt: r.lastOutboundAt ?? null, windowOpen: Boolean(r.windowExpiresAt && r.windowExpiresAt.getTime() > now), accountId: String(r.accountId) })), pagination: { page, limit, total } });
    },
  },
  {
    method: "GET", path: "conversations/:id", auth: "partner",
    handler: async (c) => {
      const oid = idParam(c.params.id);
      if (!oid) throw new GateError(400, "Invalid id");
      await dbConnect();
      const conv = await AutodmConversation.findOne({ _id: oid, ownerId: c.ownerId }).lean();
      if (!conv) throw new GateError(404, "Conversation not found");
      const msgs = await AutodmMessage.find({ conversationId: conv._id }).sort({ createdAt: 1 }).limit(300).lean();
      return json({ ok: true, conversation: { id: String(conv._id), username: conv.username ?? "", externalUserId: conv.externalUserId }, messages: msgs.map((m) => ({ id: String(m._id), direction: m.direction, content: m.content, createdAt: m.createdAt })) });
    },
  },
  {
    method: "GET", path: "analytics", auth: "partner", flag: "autodm.analytics.enabled",
    handler: async (c) => {
      await dbConnect();
      const days = Math.min(90, Math.max(1, Number(c.sp.get("days")) || 30));
      const since = new Date(Date.now() - days * 86400000);
      const match: Record<string, unknown> = { ownerId: c.ownerId, createdAt: { $gte: since } };
      const [byDayRaw, byAutoRaw, leads, clicks, inbound] = await Promise.all([
        AutodmRun.aggregate([{ $match: match }, { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, status: "$status" }, n: { $sum: 1 } } }]),
        AutodmRun.aggregate([{ $match: match }, { $group: { _id: { a: "$automationId", status: "$status" }, n: { $sum: 1 } } }]),
        AutodmLead.countDocuments({ ownerId: c.ownerId, capturedAt: { $gte: since } }),
        AutodmLinkClick.aggregate([{ $match: { ownerId: c.ownerId, createdAt: { $gte: since } } }, { $group: { _id: null, n: { $sum: "$clicks" } } }]),
        AutodmMessage.countDocuments({ ownerId: c.ownerId, direction: "inbound", createdAt: { $gte: since } }),
      ]);
      const bucket = (status: string) => (status === "sent" ? "sent" : status === "failed" ? "failed" : status === "pending" ? "pending" : "skipped");
      const dayMap = new Map<string, { sent: number; failed: number; skipped: number; pending: number }>();
      for (const r of byDayRaw) {
        const d = dayMap.get(r._id.day) ?? { sent: 0, failed: 0, skipped: 0, pending: 0 };
        d[bucket(r._id.status) as keyof typeof d] += r.n;
        dayMap.set(r._id.day, d);
      }
      const byDay = [...dayMap.entries()].sort(([x], [y]) => (x < y ? -1 : 1)).map(([day, v]) => ({ day, ...v }));
      const autos = await AutodmAutomation.find({ ownerId: c.ownerId }).select("name").lean();
      const an = new Map(autos.map((x) => [String(x._id), x.name]));
      const autoMap = new Map<string, { sent: number; failed: number; skipped: number; pending: number }>();
      for (const r of byAutoRaw) {
        const k = String(r._id.a);
        const d = autoMap.get(k) ?? { sent: 0, failed: 0, skipped: 0, pending: 0 };
        d[bucket(r._id.status) as keyof typeof d] += r.n;
        autoMap.set(k, d);
      }
      const byAutomation = [...autoMap.entries()].map(([id, v]) => ({ id, name: an.get(id) ?? "(deleted)", ...v })).sort((x, y) => y.sent - x.sent);
      const totals = byDay.reduce((t, d) => ({ sent: t.sent + d.sent, failed: t.failed + d.failed, skipped: t.skipped + d.skipped }), { sent: 0, failed: 0, skipped: 0 });
      return json({ ok: true, days, totals: { ...totals, leads, clicks: clicks[0]?.n ?? 0, replies: inbound }, byDay, byAutomation });
    },
  },
];

function leadFilter(ownerId: string, sp: URLSearchParams) {
  const { page, limit } = pageParams(sp);
  const filter: Record<string, unknown> = { ownerId };
  const q = (sp.get("q") ?? "").trim().slice(0, 60);
  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ username: rx }, { email: rx }];
  }
  const auto = idParam(sp.get("automationId") ?? undefined);
  if (auto) filter.automationId = auto;
  const acc = idParam(sp.get("accountId") ?? undefined);
  if (acc) filter.accountId = acc;
  if (sp.get("hasEmail") === "yes") filter.email = { $nin: [null, ""] };
  if (sp.get("hasEmail") === "no") filter.email = { $in: [null, ""] };
  const from = date(sp.get("from"));
  const to = date(sp.get("to"));
  if (from || to) filter.capturedAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: new Date(to.getTime() + 86399999) } : {}) };
  return { filter, page, limit };
}

// ── Public routes: Meta compliance callbacks and the cron trigger. No session; they verify themselves. ──
async function signedRequestFrom(req: Request): Promise<string> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return String(((await readJson(req)) as { signed_request?: string } | null)?.signed_request ?? "");
  const text = await req.text();
  return new URLSearchParams(text).get("signed_request") ?? "";
}

export const publicRoutes: Route[] = [
  {
    method: "POST", path: "meta/deauthorize", auth: "public",
    handler: async (c) => {
      const signed = await signedRequestFrom(c.req);
      if (signingSecrets().length === 0) return fail(503, "Not configured");
      const r = await handleDeauthorize(signed);
      return r.ok ? json({ ok: true }) : fail(400, "Invalid signed_request");
    },
  },
  {
    method: "POST", path: "meta/data-deletion", auth: "public",
    handler: async (c) => {
      const signed = await signedRequestFrom(c.req);
      if (signingSecrets().length === 0) return fail(503, "Not configured");
      const r = await handleDataDeletion(signed);
      // Meta requires exactly { url, confirmation_code }
      return r.ok ? Response.json({ url: r.url, confirmation_code: r.confirmation_code }) : fail(400, "Invalid signed_request");
    },
  },
  ...(["GET", "POST"] as const).map((method) => ({
    method, path: "cron", auth: "public" as const,
    handler: async (c: { req: Request }) => {
      const secret = config().cronSecret;
      const given = (c.req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      if (!secret || !safeEqual(given, secret)) return fail(401, "unauthorized");
      return json({ ok: true, ...(await runScheduled()) });
    },
  })),
];
