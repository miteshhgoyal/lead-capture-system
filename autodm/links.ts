import { dbConnect } from "@/lib/db";
import { config } from "./config";
import { randomToken } from "./crypto-utils";
import { isSafeHttpsUrl } from "./url-safety";
import { AutodmLinkClick } from "./models";
import type { DmButton } from "./composer";
import type { Types } from "mongoose";

/** Replaces button URLs with tracked redirects (`/autodm/r/<token>`) so analytics can count clicks. */
export async function trackButtons(buttons: DmButton[], ctx: { ownerId: string; automationId: Types.ObjectId; runId?: Types.ObjectId }): Promise<DmButton[]> {
  const site = config().siteUrl;
  if (!site || buttons.length === 0) return buttons;
  await dbConnect();
  const out: DmButton[] = [];
  for (const b of buttons) {
    const token = randomToken(9);
    await AutodmLinkClick.create({ token, url: b.url, ownerId: ctx.ownerId, automationId: ctx.automationId, runId: ctx.runId ?? null });
    out.push({ label: b.label, url: `${site}/autodm/r/${token}` });
  }
  return out;
}

/** Counts the click and returns the destination, or null when unknown/unsafe. */
export async function resolveClick(token: string): Promise<string | null> {
  if (!/^[a-f0-9]{18}$/.test(token)) return null;
  await dbConnect();
  const now = new Date();
  const doc = await AutodmLinkClick.findOneAndUpdate({ token }, { $inc: { clicks: 1 }, $set: { lastClickedAt: now } }, { returnDocument: "after" }).lean();
  if (!doc || !isSafeHttpsUrl(doc.url)) return null;
  if (doc.clicks === 1) await AutodmLinkClick.updateOne({ _id: doc._id }, { $set: { firstClickedAt: now } });
  return doc.url;
}
