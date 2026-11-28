import { isValidObjectId } from "mongoose";
import { fail, json, sameOrigin } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { partnerOr401 } from "@/lib/partner-auth";
import { BotError, leaveGroup } from "@/lib/bot";
import { TelegramGroup } from "@/lib/models/TelegramGroup";

/** Partner disconnects one of their groups: the bot leaves it and it stops receiving broadcasts. */
export async function POST(req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const partner = await partnerOr401();
  if (partner instanceof Response) return partner;

  const { id } = await props.params;
  if (!isValidObjectId(id)) return fail(404, "not_found");
  await dbConnect();
  const group = await TelegramGroup.findOne({ _id: id, partnerId: partner._id, active: true }).lean();
  if (!group) return fail(404, "not_found");

  try {
    await leaveGroup(group.chatId);
  } catch (e) {
    // Already gone from the group is fine; anything else means the bot is still in there.
    if (!(e instanceof BotError && (e.status === 403 || e.status === 404))) {
      return fail(502, e instanceof BotError ? e.code : "bot_error", { message: "The bot could not leave the group. Please try again." });
    }
  }
  await TelegramGroup.updateOne({ _id: group._id }, { $set: { active: false, disconnectedAt: new Date(), disconnectReason: "disconnected_by_partner" } });
  return json({ ok: true });
}
