import { createHmac, timingSafeEqual } from "node:crypto";
import { json } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { ConnectToken } from "@/lib/models/ConnectToken";
import { Delivery } from "@/lib/models/Delivery";
import { Partner } from "@/lib/models/Partner";
import { TelegramGroup } from "@/lib/models/TelegramGroup";

const MAX_SKEW_SEC = 300;

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.CRM_WEBHOOK_SECRET;
  if (!secret) return false;
  const given = (header ?? "").trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(given)) return false;
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest();
  return timingSafeEqual(Buffer.from(given, "hex"), expected);
}

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");

/** Events from the Telegram bot (docs/CRM_INTEGRATION.md). Signed with CRM_WEBHOOK_SECRET over the raw body. */
export async function POST(req: Request): Promise<Response> {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-signature"))) return json({ ok: false, error: "bad_signature" }, 401);

  let body: { event?: unknown; data?: Record<string, unknown>; ts?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "bad_json" }, 400);
  }
  const ts = Number(body.ts);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_SEC) return json({ ok: false, error: "stale" }, 400);
  const data = body.data ?? {};

  await dbConnect();

  switch (body.event) {
    case "group_connected":
      return groupConnected(data);

    case "group_removed": {
      const chatId = str(data.chat_id);
      if (chatId) {
        // The partner sees the group as disconnected on their Telegram page; approve refuses inactive groups.
        await TelegramGroup.updateOne(
          { chatId, active: true },
          { $set: { active: false, disconnectedAt: new Date(), disconnectReason: "removed_from_group" } }
        );
      }
      return json({ ok: true });
    }

    case "group_migrated": {
      const oldId = str(data.old_chat_id);
      const newId = str(data.new_chat_id);
      if (oldId && newId && oldId !== newId) {
        // Deliveries point at the group document, not the chat id, so they follow the migration.
        const clash = await TelegramGroup.exists({ chatId: newId });
        if (clash) console.warn("[telegram] group_migrated: new chat id already stored, keeping both records");
        else await TelegramGroup.updateOne({ chatId: oldId }, { $set: { chatId: newId } });
      }
      return json({ ok: true });
    }

    default:
      return json({ ok: true, ignored: true });
  }
}

async function groupConnected(data: Record<string, unknown>): Promise<Response> {
  const token = str(data.token);
  const chatId = str(data.chat_id);
  if (!token || !chatId) return json({ ok: false, error: "bad_request" });

  // Consume the token atomically: only one webhook can win it.
  const now = new Date();
  let t = await ConnectToken.findOneAndUpdate(
    { token, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now, usedForChatId: chatId } },
    { returnDocument: "after" }
  ).lean();
  if (!t) {
    // A retry of a webhook we already handled for the same group gets the same answer.
    t = await ConnectToken.findOne({ token, usedForChatId: chatId }).lean();
    if (!t) return json({ ok: false, error: "invalid_token" });
  }

  const partner = await Partner.findById(t.partnerId).select("name isActive").lean();
  if (!partner || !partner.isActive) return json({ ok: false, error: "partner_inactive" });

  const previous = await TelegramGroup.findOne({ chatId }).select("_id partnerId").lean();
  const group = await TelegramGroup.findOneAndUpdate(
    { chatId },
    {
      $set: {
        title: str(data.title),
        partnerId: partner._id,
        active: true,
        connectedByTelegramUserId: str(data.telegram_user_id) || undefined,
        connectedByTelegramUsername: str(data.telegram_username) || undefined,
        connectedAt: now,
        disconnectedAt: null,
        disconnectReason: null,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  // The group changed hands: the previous owner must not be able to post into it any more.
  if (previous && group && String(previous.partnerId) !== String(partner._id)) {
    await Delivery.updateMany(
      { groupId: group._id, partnerId: previous.partnerId, status: { $in: ["generating", "pending_approval"] } },
      { $set: { status: "failed", failedStage: "send", error: "group_reassigned" } }
    );
  }

  return json({ ok: true, influencer_name: partner.name });
}
