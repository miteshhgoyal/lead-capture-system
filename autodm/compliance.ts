import { dbConnect } from "@/lib/db";
import { config, signingSecrets } from "./config";
import { parseSignedRequest, randomToken } from "./crypto-utils";
import { markAccount } from "./accounts";
import { AutodmAccount, AutodmAutomation, AutodmConversation, AutodmDeletion, AutodmLead, AutodmMessage, AutodmRun } from "./models";
import { enqueue } from "./queue";

/** Meta compliance callbacks. They work even when the master switch is off (compliance is not optional). */

function userIdOf(data: Record<string, unknown> | null): string {
  const id = data?.user_id;
  return typeof id === "string" || typeof id === "number" ? String(id) : "";
}

export async function handleDeauthorize(signedRequest: string): Promise<{ ok: boolean }> {
  const data = parseSignedRequest(signedRequest, signingSecrets());
  const userId = userIdOf(data);
  if (!userId) return { ok: false };
  await dbConnect();
  const accounts = await AutodmAccount.find({ externalAccountId: userId }).lean();
  for (const a of accounts) {
    await AutodmAccount.updateOne({ _id: a._id }, { $set: { accessTokenEncrypted: "-", webhookSubscribed: false } });
    await markAccount(a, "revoked", "Deauthorized from Instagram/Facebook", `@${a.username} was disconnected because access was removed on Meta's side.`);
  }
  return { ok: true };
}

export async function handleDataDeletion(signedRequest: string): Promise<{ ok: false } | { ok: true; url: string; confirmation_code: string }> {
  const data = parseSignedRequest(signedRequest, signingSecrets());
  const userId = userIdOf(data);
  if (!userId) return { ok: false };
  await dbConnect();
  const code = randomToken(8);
  await AutodmDeletion.create({ code, externalUserId: userId, status: "pending" });
  await enqueue("delete_user_data", { code });
  return { ok: true, url: `${config().siteUrl}/autodm/data-deletion-status/${code}`, confirmation_code: code };
}

/** Deletes leads, conversations, messages and run details tied to the Meta user id (and revokes their account). */
export async function runDeletion(code: string): Promise<void> {
  await dbConnect();
  const req = await AutodmDeletion.findOne({ code });
  if (!req || req.status === "done") return;
  const uid = req.externalUserId;
  const convs = await AutodmConversation.find({ externalUserId: uid }).select("_id").lean();
  const counts: Record<string, number> = {};
  counts.messages = (await AutodmMessage.deleteMany({ conversationId: { $in: convs.map((c) => c._id) } })).deletedCount ?? 0;
  counts.conversations = (await AutodmConversation.deleteMany({ externalUserId: uid })).deletedCount ?? 0;
  counts.leads = (await AutodmLead.deleteMany({ externalUserId: uid })).deletedCount ?? 0;
  counts.runs = (await AutodmRun.updateMany({ externalUserId: uid }, { $unset: { username: 1, metaResponse: 1 }, $set: { externalUserId: "deleted" } })).modifiedCount ?? 0;
  // If this id is a connected account itself, remove its token and pause its automations.
  const accounts = await AutodmAccount.find({ externalAccountId: uid }).lean();
  for (const a of accounts) {
    await AutodmAccount.updateOne({ _id: a._id }, { $set: { accessTokenEncrypted: "-", status: "revoked", webhookSubscribed: false } });
    await AutodmAutomation.updateMany({ accountId: a._id }, { $set: { status: "paused", pausedReason: "data_deleted" } });
  }
  counts.accounts = accounts.length;
  await AutodmDeletion.updateOne({ _id: req._id }, { $set: { status: "done", counts, completedAt: new Date() } });
}

export async function deletionStatus(code: string): Promise<{ found: boolean; status?: string; completedAt?: Date | null }> {
  if (!/^[a-f0-9]{16}$/.test(code)) return { found: false };
  await dbConnect();
  const d = await AutodmDeletion.findOne({ code }).lean();
  return d ? { found: true, status: d.status, completedAt: d.completedAt } : { found: false };
}

/** Admin: removes everything AutoDM stores for one partner (owner). */
export async function purgeOwner(ownerId: string): Promise<Record<string, number>> {
  await dbConnect();
  const accounts = await AutodmAccount.find({ ownerId }).select("_id").lean();
  const ids = accounts.map((a) => a._id);
  const convs = await AutodmConversation.find({ ownerId }).select("_id").lean();
  const out: Record<string, number> = {};
  out.messages = (await AutodmMessage.deleteMany({ conversationId: { $in: convs.map((c) => c._id) } })).deletedCount ?? 0;
  out.conversations = (await AutodmConversation.deleteMany({ ownerId })).deletedCount ?? 0;
  out.leads = (await AutodmLead.deleteMany({ ownerId })).deletedCount ?? 0;
  out.runs = (await AutodmRun.deleteMany({ ownerId })).deletedCount ?? 0;
  out.automations = (await AutodmAutomation.deleteMany({ ownerId })).deletedCount ?? 0;
  out.accounts = (await AutodmAccount.deleteMany({ _id: { $in: ids } })).deletedCount ?? 0;
  return out;
}
