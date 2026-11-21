import { dbConnect } from "@/lib/db";
import { DEFAULT_MESSAGE_RETENTION_DAYS, DEFAULT_PAYLOAD_RETENTION_DAYS, TOKEN_REFRESH_WITHIN_DAYS, config, DAY } from "./config";
import { encryptToken } from "./token-vault";
import { MetaError } from "./errors";
import { getMetaClient } from "./meta";
import { getAccountToken, markAccount } from "./accounts";
import { AutodmAccount, AutodmMessage, AutodmSetting, AutodmWebhookEvent } from "./models";
import { processDue } from "./queue";
import { jobHandlers } from "./runner";
import { FeatureGate } from "./settings-store";

/** Refreshes long-lived tokens that expire within ~10 days. Failure marks the account token_expired and notifies the user. */
export async function refreshTokens(): Promise<{ refreshed: number; failed: number }> {
  await dbConnect();
  const out = { refreshed: 0, failed: 0 };
  const soon = new Date(Date.now() + TOKEN_REFRESH_WITHIN_DAYS * DAY);
  const accounts = await AutodmAccount.find({ status: "active", tokenExpiresAt: { $ne: null, $lt: soon } }).select("_id").lean();
  for (const { _id } of accounts) {
    const found = await getAccountToken(_id);
    if (!found) continue;
    const { account, token } = found;
    try {
      const r = await getMetaClient().refreshToken(account.platform, token);
      await AutodmAccount.updateOne({ _id }, { $set: { accessTokenEncrypted: encryptToken(r.accessToken, config().encryptionKey), tokenLastRefreshedAt: new Date(), ...(r.expiresInSec ? { tokenExpiresAt: new Date(Date.now() + r.expiresInSec * 1000) } : {}) } });
      out.refreshed++;
    } catch (e) {
      out.failed++;
      const expired = account.tokenExpiresAt && account.tokenExpiresAt.getTime() < Date.now();
      if (expired || (e instanceof MetaError && e.kind === "token_invalid")) {
        await markAccount(account, "token_expired", e instanceof Error ? e.message : "refresh failed", `Your @${account.username} connection expired and could not be refreshed. Reconnect it to resume your automations.`);
      }
    }
  }
  return out;
}

/** Purges raw payloads and old message bodies. Aggregates (runs, counters, leads) are kept. */
export async function applyRetention(): Promise<{ payloads: number; messages: number }> {
  await dbConnect();
  const s = await FeatureGate.all();
  const payloadDays = Number(s["autodm.payload_retention_days"]) || DEFAULT_PAYLOAD_RETENTION_DAYS;
  const messageDays = Number(s["autodm.message_retention_days"]) || DEFAULT_MESSAGE_RETENTION_DAYS;
  const p = await AutodmWebhookEvent.updateMany({ receivedAt: { $lt: new Date(Date.now() - payloadDays * DAY) }, rawPayload: { $exists: true } }, { $unset: { rawPayload: 1, normalized: 1 } });
  const m = await AutodmMessage.updateMany({ createdAt: { $lt: new Date(Date.now() - messageDays * DAY) }, content: { $ne: "[purged]" } }, { $set: { content: "[purged]" } });
  return { payloads: p.modifiedCount, messages: m.modifiedCount };
}

async function dueToday(key: string, everyMs: number): Promise<boolean> {
  const row = await AutodmSetting.findOne({ key: `internal.lastRun.${key}` }).lean();
  const last = typeof row?.value === "number" ? row.value : 0;
  if (Date.now() - last < everyMs) return false;
  await AutodmSetting.updateOne({ key: `internal.lastRun.${key}` }, { $set: { value: Date.now() } }, { upsert: true });
  return true;
}

/**
 * Called by /api/autodm/cron (every minute is fine). Always drains the job queue (compliance jobs must run even when
 * the feature is dark; other jobs are dropped). Token refresh and retention no-op when the master switch is off.
 */
export async function runScheduled(): Promise<Record<string, unknown>> {
  await dbConnect();
  const queue = await processDue(jobHandlers, { max: 50, budgetMs: 25_000 });
  const master = (await FeatureGate.all(true))["autodm.enabled"] === true;
  if (!master) return { master: false, queue };
  const result: Record<string, unknown> = { master: true, queue };
  if (await dueToday("tokens", 6 * 3600 * 1000)) result.tokens = await refreshTokens();
  if (await dueToday("retention", 24 * 3600 * 1000)) result.retention = await applyRetention();
  return result;
}
