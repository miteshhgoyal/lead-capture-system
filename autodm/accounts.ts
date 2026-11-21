import { dbConnect } from "@/lib/db";
import { config } from "./config";
import { sha256, randomToken } from "./crypto-utils";
import { MetaError } from "./errors";
import { getMetaClient } from "./meta";
import type { Types } from "mongoose";
import { AutodmAccount, AutodmAutomation, AutodmOAuthState, type IAccount } from "./models";
import { decryptToken, encryptToken } from "./token-vault";
import { FeatureGate, GateError } from "./settings-store";
import { notify } from "./notify";
import type { Platform } from "./types";

const STATE_TTL_MS = 10 * 60 * 1000;

/** What the API may return about an account. Never the token. */
export function publicAccount(a: IAccount) {
  return { id: String(a._id), platform: a.platform, username: a.username, displayName: a.displayName ?? null, profilePictureUrl: a.profilePictureUrl ?? null, accountType: a.accountType, status: a.status, tokenExpiresAt: a.tokenExpiresAt ?? null, webhookSubscribed: a.webhookSubscribed, lastError: a.lastError ?? null, connectedAt: a.connectedAt };
}

export async function getAccountToken(accountId: unknown): Promise<{ account: IAccount; token: string } | null> {
  await dbConnect();
  const account = await AutodmAccount.findById(accountId).select("+accessTokenEncrypted").lean<IAccount | null>();
  if (!account || !account.accessTokenEncrypted || account.accessTokenEncrypted === "-") return null;
  try {
    return { account, token: decryptToken(account.accessTokenEncrypted, config().encryptionKey) };
  } catch {
    return null;
  }
}

type Id = Types.ObjectId | string;

export async function pauseAccountAutomations(accountId: Id, reason: string): Promise<void> {
  await AutodmAutomation.updateMany({ accountId, status: "active" }, { $set: { status: "paused", pausedReason: reason } });
}

/** Marks the account unusable (expired/revoked/...) and pauses its automations. */
export async function markAccount(account: Pick<IAccount, "_id" | "ownerId" | "username">, status: IAccount["status"], note: string, notice?: string): Promise<void> {
  await dbConnect();
  await AutodmAccount.updateOne({ _id: account._id }, { $set: { status, lastError: note.slice(0, 300) } });
  await pauseAccountAutomations(account._id, status);
  if (notice) await notify(account.ownerId, status, notice);
}

/** Step 1 of the connect flow: a single-use, 10-minute state bound to the user and platform. */
export async function startConnect(ownerId: string, platform: Platform): Promise<string> {
  const s = await FeatureGate.all();
  if (s[`autodm.${platform}.enabled`] !== true) throw new GateError(403, `${platform === "instagram" ? "Instagram" : "Facebook"} is currently disabled by the administrator.`);
  if (s["autodm.oauth.enabled"] !== true) throw new GateError(403, "New connections are currently disabled by the administrator.");
  await dbConnect();
  const owned = await AutodmAccount.countDocuments({ ownerId, status: { $ne: "revoked" } });
  if (owned >= Number(s["autodm.max_accounts_per_user"])) throw new GateError(409, `You can connect up to ${s["autodm.max_accounts_per_user"]} accounts.`);
  const state = randomToken(24);
  await AutodmOAuthState.create({ stateHash: sha256(state), ownerId, platform, expiresAt: new Date(Date.now() + STATE_TTL_MS) });
  return getMetaClient().buildAuthorizeUrl(platform, state);
}

export type ConnectOutcome = { ok: true; accountId: string } | { ok: false; code: string; message: string };

const ERRORS: Record<string, string> = {
  denied: "You cancelled the connection, so nothing was changed.",
  invalid_state: "This connection link expired or was already used. Please start again.",
  not_professional: "Only Instagram Professional (Business or Creator) accounts can be connected. Switch your account to Professional in the Instagram app and try again.",
  account_in_use: "This account is already connected to another user.",
  disabled: "Connecting accounts is currently disabled.",
  limit: "You reached the maximum number of connected accounts.",
  failed: "We could not complete the connection with Meta. Please try again.",
};
export const connectErrorMessage = (code: string): string => ERRORS[code] ?? ERRORS.failed;

/** Step 2: validate state, exchange the code, store the encrypted token, subscribe webhooks, upsert the account. */
export async function completeConnect(ownerId: string, p: { code?: string | null; state?: string | null; error?: string | null }): Promise<ConnectOutcome> {
  const fail = (code: string): ConnectOutcome => ({ ok: false, code, message: connectErrorMessage(code) });
  if (p.error) return fail("denied");
  if (!p.code || !p.state) return fail("invalid_state");
  await dbConnect();
  const st = await AutodmOAuthState.findOneAndUpdate({ stateHash: sha256(p.state), usedAt: null, expiresAt: { $gt: new Date() } }, { $set: { usedAt: new Date() } }, { returnDocument: "before" }).lean();
  if (!st || st.ownerId !== ownerId) return fail("invalid_state");
  const platform = st.platform;

  const s = await FeatureGate.all();
  if (s["autodm.oauth.enabled"] !== true || s[`autodm.${platform}.enabled`] !== true) return fail("disabled");

  const client = getMetaClient();
  try {
    const exchanged = await client.exchangeCode(platform, p.code);
    const profile = await client.getProfile(platform, exchanged.accessToken, exchanged.accountIdHint);
    if (!profile.externalId) return fail("failed");
    if (!profile.isProfessional) return fail("not_professional");

    const existing = await AutodmAccount.findOne({ platform, externalAccountId: profile.externalId }).lean();
    if (existing && existing.ownerId !== ownerId && existing.status !== "revoked") return fail("account_in_use");
    if (!existing) {
      const owned = await AutodmAccount.countDocuments({ ownerId, status: { $ne: "revoked" } });
      if (owned >= Number(s["autodm.max_accounts_per_user"])) return fail("limit");
    }

    const scopes = platform === "instagram" ? config().instagramScopes : config().facebookScopes;
    const fields = {
      ownerId,
      username: profile.username,
      displayName: profile.displayName,
      profilePictureUrl: profile.pictureUrl,
      accountType: profile.accountType,
      accessTokenEncrypted: encryptToken(exchanged.accessToken, config().encryptionKey),
      tokenExpiresAt: exchanged.expiresInSec ? new Date(Date.now() + exchanged.expiresInSec * 1000) : null,
      tokenLastRefreshedAt: new Date(),
      scopes,
      status: "active" as const,
      lastError: undefined,
      connectedAt: new Date(),
    };
    const doc = await AutodmAccount.findOneAndUpdate({ platform, externalAccountId: profile.externalId }, { $set: fields }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).lean();
    let subscribed = false;
    try {
      await client.subscribeWebhooks(platform, exchanged.accessToken, profile.externalId);
      subscribed = true;
    } catch (e) {
      await AutodmAccount.updateOne({ _id: doc!._id }, { $set: { lastError: `Webhook subscription failed: ${(e as Error).message}`.slice(0, 300) } });
    }
    await AutodmAccount.updateOne({ _id: doc!._id }, { $set: { webhookSubscribed: subscribed } });
    return { ok: true, accountId: String(doc!._id) };
  } catch (e) {
    if (e instanceof MetaError && e.kind === "permission_missing") return fail("failed");
    console.error("[autodm] connect failed:", e instanceof Error ? e.message : "unknown");
    return fail("failed");
  }
}

/** Disconnect: unsubscribe webhook (best effort), wipe the token, pause automations. Data is kept for history. */
export async function disconnectAccount(accountId: Id, status: "revoked" | "disabled_by_admin" = "revoked"): Promise<void> {
  const found = await getAccountToken(accountId);
  if (found) {
    try {
      await getMetaClient().unsubscribeWebhooks(found.account.platform, found.token, found.account.externalAccountId);
    } catch {
      /* best effort */
    }
  }
  await dbConnect();
  await AutodmAccount.updateOne({ _id: accountId }, { $set: { status, webhookSubscribed: false, ...(status === "revoked" ? { accessTokenEncrypted: "-" } : {}) } });
  await pauseAccountAutomations(accountId, status);
}
