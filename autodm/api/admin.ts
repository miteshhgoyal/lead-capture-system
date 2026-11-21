import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { json, readJson } from "@/lib/http";
import { Partner } from "@/lib/models/Partner";
import { config, TOKEN_REFRESH_WITHIN_DAYS, DAY } from "../config";
import { disconnectAccount, markAccount, publicAccount } from "../accounts";
import { purgeOwner } from "../compliance";
import { computeReadiness } from "../readiness";
import { redact } from "../redact";
import { AutodmAccount, AutodmAudit, AutodmAutomation, AutodmJob, AutodmRun, AutodmWebhookEvent, type IAccount } from "../models";
import { executeRun } from "../runner";
import { runScheduled } from "../scheduled";
import { FeatureGate, GateError } from "../settings-store";
import { SETTING_DEFS } from "../settings-defs";
import { idParam, pageParams, type Ctx, type Route } from "./router";

const actor = (c: Ctx) => c.admin?.email ?? "admin";

const rangeFilter = (sp: URLSearchParams, field: string) => {
  const from = sp.get("from") ? new Date(sp.get("from")!) : null;
  const to = sp.get("to") ? new Date(sp.get("to")!) : null;
  const f: Record<string, Date> = {};
  if (from && !Number.isNaN(from.getTime())) f.$gte = from;
  if (to && !Number.isNaN(to.getTime())) f.$lte = new Date(to.getTime() + 86399999);
  return Object.keys(f).length ? { [field]: f } : {};
};

export const adminRoutes: Route[] = [
  {
    method: "GET", path: "settings", auth: "admin",
    handler: async () => {
      await dbConnect();
      const [values, audit] = await Promise.all([FeatureGate.all(true), AutodmAudit.find({}).sort({ createdAt: -1 }).limit(60).lean()]);
      return json({ ok: true, defs: SETTING_DEFS, values, audit: audit.map((a) => ({ id: String(a._id), actor: a.actor, action: a.action, key: a.key, oldValue: a.oldValue, newValue: a.newValue, ip: a.ip, createdAt: a.createdAt })), production: config().isProduction });
    },
  },
  {
    method: "PUT", path: "settings", auth: "admin",
    handler: async (c) => {
      const body = z.object({ key: z.string().max(80), value: z.unknown(), override: z.boolean().optional() }).parse(await readJson(c.req));
      const value = await FeatureGate.set(body.key, body.value, actor(c), c.ip, { devOverride: body.override });
      return json({ ok: true, key: body.key, value });
    },
  },
  {
    method: "GET", path: "readiness", auth: "admin",
    handler: async () => {
      await dbConnect();
      const r = computeReadiness();
      const soon = new Date(Date.now() + TOKEN_REFRESH_WITHIN_DAYS * DAY);
      const [lastEvent, lastSent, queued, dead, expiring] = await Promise.all([
        AutodmWebhookEvent.findOne({}).sort({ receivedAt: -1 }).select("receivedAt").lean(),
        AutodmRun.findOne({ status: "sent" }).sort({ sentAt: -1 }).select("sentAt").lean(),
        AutodmJob.countDocuments({ status: "queued" }),
        AutodmJob.countDocuments({ status: "dead" }),
        AutodmAccount.countDocuments({ status: "active", tokenExpiresAt: { $ne: null, $lt: soon } }),
      ]);
      return json({ ok: true, items: r.items, ready: r.ready, mock: r.mock, missing: r.missing.map((m) => m.key), stats: { lastWebhookAt: lastEvent?.receivedAt ?? null, lastSentAt: lastSent?.sentAt ?? null, queueDepth: queued, failedJobs: dead, tokensExpiringSoon: expiring, graphVersion: config().graphVersion } });
    },
  },
  {
    method: "GET", path: "accounts", auth: "admin",
    handler: async (c) => {
      await dbConnect();
      const { page, limit, skip } = pageParams(c.sp, 100);
      const filter: Record<string, unknown> = {};
      const status = c.sp.get("status");
      if (status) filter.status = status;
      const q = (c.sp.get("q") ?? "").trim().slice(0, 40);
      if (q) filter.username = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      const [total, rows] = await Promise.all([AutodmAccount.countDocuments(filter), AutodmAccount.find(filter).sort({ connectedAt: -1 }).skip(skip).limit(limit).lean<IAccount[]>()]);
      const owners = await Partner.find({ _id: { $in: [...new Set(rows.map((r) => r.ownerId))].filter((x) => idParam(x)) } }).select("name slug").lean();
      const on = new Map(owners.map((o) => [String(o._id), o]));
      return json({ ok: true, accounts: rows.map((a) => ({ ...publicAccount(a), ownerId: a.ownerId, owner: on.get(a.ownerId)?.name ?? "(unknown)", ownerSlug: on.get(a.ownerId)?.slug ?? "" })), pagination: { page, limit, total } });
    },
  },
  {
    method: "POST", path: "accounts/:id/:action", auth: "admin",
    handler: async (c) => {
      const id = idParam(c.params.id);
      if (!id) throw new GateError(400, "Invalid id");
      await dbConnect();
      const a = await AutodmAccount.findById(id).lean<IAccount>();
      if (!a) throw new GateError(404, "Account not found");
      const act = c.params.action;
      if (act === "disable") await markAccount(a, "disabled_by_admin", "Disabled by an administrator", `@${a.username} was disabled by an administrator. Contact support if you think this is a mistake.`);
      else if (act === "enable") {
        if (a.status !== "disabled_by_admin") throw new GateError(409, "Only accounts disabled by an administrator can be re-enabled.");
        await AutodmAccount.updateOne({ _id: a._id }, { $set: { status: "active", lastError: undefined } });
      } else if (act === "disconnect") await disconnectAccount(a._id, "revoked");
      else throw new GateError(404, "Unknown action");
      await AutodmAudit.create({ actor: actor(c), action: `account.${act}`, key: String(a._id), ip: c.ip });
      return json({ ok: true });
    },
  },
  {
    method: "GET", path: "logs", auth: "admin",
    handler: async (c) => {
      await dbConnect();
      const { page, limit, skip } = pageParams(c.sp, 100);
      const type = c.sp.get("type") ?? "runs";
      const status = c.sp.get("status");
      const accountId = idParam(c.sp.get("accountId") ?? undefined);
      if (type === "events") {
        const filter: Record<string, unknown> = { ...rangeFilter(c.sp, "receivedAt"), ...(status ? { status } : {}) };
        const [total, rows] = await Promise.all([AutodmWebhookEvent.countDocuments(filter), AutodmWebhookEvent.find(filter).sort({ receivedAt: -1 }).skip(skip).limit(limit).lean()]);
        return json({ ok: true, type, rows: rows.map((e) => ({ id: String(e._id), eventType: e.eventType, accountExternalId: e.accountExternalId, status: e.status, note: e.note ?? "", error: e.error ?? "", receivedAt: e.receivedAt, processedAt: e.processedAt, payload: redact(e.normalized ?? e.rawPayload ?? null) })), pagination: { page, limit, total } });
      }
      if (type === "audit") {
        const [total, rows] = await Promise.all([AutodmAudit.countDocuments({}), AutodmAudit.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()]);
        return json({ ok: true, type, rows: rows.map((a) => ({ id: String(a._id), actor: a.actor, action: a.action, key: a.key, oldValue: a.oldValue, newValue: a.newValue, ip: a.ip, createdAt: a.createdAt })), pagination: { page, limit, total } });
      }
      const filter: Record<string, unknown> = { ...rangeFilter(c.sp, "createdAt"), ...(status ? { status } : {}), ...(accountId ? { accountId } : {}) };
      const [total, rows] = await Promise.all([AutodmRun.countDocuments(filter), AutodmRun.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()]);
      return json({ ok: true, type: "runs", rows: rows.map((r) => ({ id: String(r._id), action: r.action, status: r.status, triggerType: r.triggerType, username: r.username ?? "", accountId: String(r.accountId), automationId: String(r.automationId), attemptCount: r.attemptCount, errorCode: r.errorCode ?? "", errorMessage: r.errorMessage ?? "", createdAt: r.createdAt, sentAt: r.sentAt, triggerAt: r.triggerAt, response: redact(r.metaResponse ?? null) })), pagination: { page, limit, total } });
    },
  },
  {
    // Replay a run that was skipped while sending was switched off. The window rules are checked again.
    method: "POST", path: "runs/:id/replay", auth: "admin",
    handler: async (c) => {
      const id = idParam(c.params.id);
      if (!id) throw new GateError(400, "Invalid id");
      await dbConnect();
      const run = await AutodmRun.findById(id).lean();
      if (!run) throw new GateError(404, "Run not found");
      if (run.status !== "skipped_sending_disabled") throw new GateError(409, "Only runs skipped because sending was off can be replayed.");
      if ((await FeatureGate.all())["autodm.sending.enabled"] !== true) throw new GateError(409, "Turn sending back on first.");
      await executeRun(id, { replay: true });
      const after = await AutodmRun.findById(id).select("status").lean();
      await AutodmAudit.create({ actor: actor(c), action: "run.replay", key: id, newValue: after?.status, ip: c.ip });
      return json({ ok: true, status: after?.status });
    },
  },
  {
    method: "POST", path: "pause-all", auth: "admin",
    handler: async (c) => {
      await dbConnect();
      const r = await AutodmAutomation.updateMany({ status: "active" }, { $set: { status: "paused", pausedReason: "admin_pause_all" } });
      await AutodmAudit.create({ actor: actor(c), action: "automations.pause_all", newValue: r.modifiedCount, ip: c.ip });
      return json({ ok: true, paused: r.modifiedCount });
    },
  },
  {
    method: "POST", path: "purge-user", auth: "admin",
    handler: async (c) => {
      const body = z.object({ ownerId: z.string().regex(/^[a-f0-9]{24}$/i), confirm: z.string() }).parse(await readJson(c.req));
      if (body.confirm !== body.ownerId) throw new GateError(400, "Type the partner id again to confirm.");
      const counts = await purgeOwner(body.ownerId);
      await AutodmAudit.create({ actor: actor(c), action: "user.purge", key: body.ownerId, newValue: counts, ip: c.ip });
      return json({ ok: true, counts });
    },
  },
  {
    method: "POST", path: "run-scheduled", auth: "admin",
    handler: async (c) => {
      const r = await runScheduled();
      await AutodmAudit.create({ actor: actor(c), action: "scheduler.run_now", ip: c.ip });
      return json({ ok: true, ...r });
    },
  },
];

