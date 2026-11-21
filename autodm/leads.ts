import { dbConnect } from "@/lib/db";
import { csvLine, extractEmail } from "./csv";
import { AutodmConversation, AutodmLead, type IAccount, type IAutomation } from "./models";
import type { Types } from "mongoose";

/** Stores a lead for a person who interacted. Never creates a conversation to message anyone. */
export async function captureLead(a: { account: Pick<IAccount, "_id" | "ownerId">; automation: Pick<IAutomation, "_id" | "triggerType">; externalUserId: string; username?: string }): Promise<void> {
  await dbConnect();
  await AutodmLead.updateOne(
    { accountId: a.account._id, automationId: a.automation._id, externalUserId: a.externalUserId },
    { $setOnInsert: { ownerId: a.account.ownerId, source: a.automation.triggerType, capturedAt: new Date(), consentNote: "Person contacted the account first; reply sent in response to their message/comment." }, ...(a.username ? { $set: { username: a.username } } : {}) },
    { upsert: true }
  );
}

/** The next inbound message after an email prompt: store the address on the lead and stop waiting. */
export async function attachEmail(conv: { _id: Types.ObjectId; accountId: Types.ObjectId; externalUserId: string; awaitingEmailFor?: Types.ObjectId | null }, email: string): Promise<boolean> {
  if (!conv.awaitingEmailFor) return false;
  await dbConnect();
  await AutodmLead.updateOne({ accountId: conv.accountId, automationId: conv.awaitingEmailFor, externalUserId: conv.externalUserId }, { $set: { email } });
  await AutodmConversation.updateOne({ _id: conv._id }, { $set: { awaitingEmailFor: null } });
  return true;
}

export const LEAD_CSV_HEADER = ["Captured (UTC)", "Account", "Username", "User id", "Email", "Source", "Automation"];
export { csvLine, extractEmail };
