import { after } from "next/server";
import { z } from "zod";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { adminOr401 } from "@/lib/admin-auth";
import { Broadcast } from "@/lib/models/Broadcast";
import { Delivery } from "@/lib/models/Delivery";
import { Partner } from "@/lib/models/Partner";
import { TelegramGroup } from "@/lib/models/TelegramGroup";
import { createBroadcast, generateBroadcast } from "@/lib/telegram/deliveries";

// The preview generation runs after the response (see after() below) and needs time for N rewrites.
export const maxDuration = 300;

const BodySchema = z.object({ text: z.string().trim().min(1, "Write a message").max(4000, "Telegram messages are limited to 4096 characters") });

/** Recent broadcasts with per-status delivery counts, plus how many groups a new one would reach. */
export async function GET(): Promise<Response> {
  const admin = await adminOr401();
  if (admin instanceof Response) return admin;
  await dbConnect();

  const [broadcasts, activeGroups] = await Promise.all([
    Broadcast.find().sort({ createdAt: -1 }).limit(30).lean(),
    TelegramGroup.find({ active: true }).select("partnerId").lean(),
  ]);
  const activePartnerIds = new Set(
    (await Partner.find({ _id: { $in: activeGroups.map((g) => g.partnerId) }, isActive: true }).select("_id").lean()).map((p) => String(p._id))
  );
  const targetGroups = activeGroups.filter((g) => activePartnerIds.has(String(g.partnerId))).length;

  const counts = await Delivery.aggregate<{ _id: { b: unknown; s: string }; n: number; autoApproved: number }>([
    { $match: { broadcastId: { $in: broadcasts.map((b) => b._id) } } },
    {
      $group: {
        _id: { b: "$broadcastId", s: "$status" },
        n: { $sum: 1 },
        autoApproved: { $sum: { $cond: ["$autoApproved", 1, 0] } },
      },
    },
  ]);
  const byBroadcast = new Map<string, { counts: Record<string, number>; autoApprovedCount: number }>();
  for (const c of counts) {
    const k = String(c._id.b);
    const row = byBroadcast.get(k) ?? { counts: {}, autoApprovedCount: 0 };
    row.counts[c._id.s] = c.n;
    row.autoApprovedCount += c.autoApproved;
    byBroadcast.set(k, row);
  }

  return json({
    ok: true,
    targets: { groups: targetGroups, partners: activePartnerIds.size },
    broadcasts: broadcasts.map((b) => ({
      _id: String(b._id),
      text: b.text,
      createdBy: b.createdBy,
      createdAt: b.createdAt.toISOString(),
      deliveryCount: b.deliveryCount,
      counts: byBroadcast.get(String(b._id))?.counts ?? {},
      autoApprovedCount: byBroadcast.get(String(b._id))?.autoApprovedCount ?? 0,
    })),
  });
}

/** Creates a broadcast and one Delivery per connected group, then generates previews in the background. */
export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const admin = await adminOr401();
  if (admin instanceof Response) return admin;

  const parsed = BodySchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid message");

  const r = await createBroadcast(parsed.data.text, admin.email);
  if (r.deliveries > 0) {
    after(() => generateBroadcast(r.id).catch((e) => console.error("[telegram] preview generation failed:", e)));
  }
  return json({ ok: true, ...r });
}
