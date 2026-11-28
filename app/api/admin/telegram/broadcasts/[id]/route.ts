import { isValidObjectId } from "mongoose";
import { fail, json } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { adminOr401 } from "@/lib/admin-auth";
import { Broadcast } from "@/lib/models/Broadcast";
import { Delivery } from "@/lib/models/Delivery";
import { Partner } from "@/lib/models/Partner";
import { TelegramGroup } from "@/lib/models/TelegramGroup";

/** One broadcast with every delivery (partner, group, status, preview). */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  const admin = await adminOr401();
  if (admin instanceof Response) return admin;
  const { id } = await props.params;
  if (!isValidObjectId(id)) return fail(404, "not_found");

  await dbConnect();
  const b = await Broadcast.findById(id).lean();
  if (!b) return fail(404, "not_found");
  const deliveries = await Delivery.find({ broadcastId: b._id }).sort({ _id: 1 }).lean();
  const [partners, groups] = await Promise.all([
    Partner.find({ _id: { $in: deliveries.map((d) => d.partnerId) } }).select("name").lean(),
    TelegramGroup.find({ _id: { $in: deliveries.map((d) => d.groupId) } }).select("title").lean(),
  ]);
  const pName = new Map(partners.map((p) => [String(p._id), p.name]));
  const gTitle = new Map(groups.map((g) => [String(g._id), g.title]));

  return json({
    ok: true,
    broadcast: { _id: String(b._id), text: b.text, createdBy: b.createdBy, createdAt: b.createdAt.toISOString() },
    deliveries: deliveries.map((d) => ({
      _id: String(d._id),
      partner: pName.get(String(d.partnerId)) ?? "(deleted partner)",
      group: gTitle.get(String(d.groupId)) ?? "(unknown group)",
      style: d.style,
      status: d.status,
      autoApproved: d.autoApproved ?? false,
      preview: d.preview ?? null,
      error: d.error ?? null,
      failedStage: d.failedStage ?? null,
      sentAt: d.sentAt?.toISOString() ?? null,
    })),
  });
}
