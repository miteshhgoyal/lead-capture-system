import type { Metadata } from "next";
import { dbConnect } from "@/lib/db";
import { getPartnerSession } from "@/lib/partner-auth";
import { Broadcast } from "@/lib/models/Broadcast";
import { Delivery } from "@/lib/models/Delivery";
import { TelegramGroup } from "@/lib/models/TelegramGroup";
import { APPROVAL_WINDOW_MS, expireStale } from "@/lib/telegram/deliveries";
import { DEFAULT_STYLE } from "@/lib/telegram/styles";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { TelegramClient, type DeliveryView, type GroupView } from "./TelegramClient";

export const metadata: Metadata = { title: "Telegram" };
export const dynamic = "force-dynamic";

export default async function TelegramPage() {
  const partner = (await getPartnerSession())!; // layout redirects when signed out
  await dbConnect();
  await expireStale(); // read-time check, so nothing stale is shown as approvable even if cron is late

  const [groups, deliveries] = await Promise.all([
    TelegramGroup.find({ partnerId: partner._id }).sort({ active: -1, connectedAt: -1 }).lean(),
    Delivery.find({ partnerId: partner._id }).sort({ createdAt: -1 }).limit(60).lean(),
  ]);
  const broadcasts = await Broadcast.find({ _id: { $in: deliveries.map((d) => d.broadcastId) } }).select("text").lean();
  const original = new Map(broadcasts.map((b) => [String(b._id), b.text]));
  const groupTitle = new Map(groups.map((g) => [String(g._id), g.title]));
  const groupActive = new Map(groups.map((g) => [String(g._id), g.active]));

  const groupViews: GroupView[] = groups.map((g) => ({
    _id: String(g._id),
    title: g.title || g.chatId,
    active: g.active,
    connectedAt: g.connectedAt.toISOString(),
    disconnectedAt: g.disconnectedAt?.toISOString() ?? null,
    disconnectReason: g.disconnectReason ?? null,
  }));

  const deliveryViews: DeliveryView[] = deliveries.map((d) => ({
    _id: String(d._id),
    group: groupTitle.get(String(d.groupId)) ?? "Unknown group",
    groupActive: groupActive.get(String(d.groupId)) ?? false,
    original: original.get(String(d.broadcastId)) ?? "",
    preview: d.preview ?? null,
    unchanged: d.unchanged ?? false,
    autoApproved: d.autoApproved ?? false,
    version: d.version,
    status: d.status,
    style: d.style,
    error: d.error ?? null,
    createdAt: d.createdAt.toISOString(),
    expiresAt: d.pendingSince ? new Date(d.pendingSince.getTime() + APPROVAL_WINDOW_MS).toISOString() : null,
    sentAt: d.sentAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Telegram"
        description="Connect your Telegram groups and review the company's messages before they are posted. You can opt in to auto-approve future previews after reviewing one."
      />
      <TelegramClient
        groups={groupViews}
        deliveries={deliveryViews}
        style={partner.style?.trim() || DEFAULT_STYLE}
        autoApprove={partner.telegramAutoApprove ?? false}
      />
    </div>
  );
}
