import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { getPartnerSession } from "@/lib/partner-auth";
import { maskEmail, maskPhone } from "@/lib/mask";
import { PortalClient, type PortalLead } from "./PortalClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Partner Portal", robots: { index: false, follow: false } };

const LEAD_LIMIT = 300;

export default async function PartnerPortalPage() {
  const partner = await getPartnerSession();
  if (!partner) redirect("/partner/login");

  await dbConnect();
  // partnerId is the real link; partnerSlug catches older leads saved before the id was stored.
  const match = { $or: [{ partnerId: partner._id }, { partnerSlug: partner.slug }] };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [total, today, week, byStatus, rows] = await Promise.all([
    Lead.countDocuments(match),
    Lead.countDocuments({ ...match, createdAt: { $gte: startOfToday } }),
    Lead.countDocuments({ ...match, createdAt: { $gte: weekAgo } }),
    Lead.aggregate<{ _id: string; n: number }>([{ $match: match }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
    Lead.find(match).select("name phone email country status createdAt").sort({ createdAt: -1 }).limit(LEAD_LIMIT).lean(),
  ]);

  // Masking happens here: raw email / phone are never serialised to the browser.
  const leads: PortalLead[] = rows.map((l) => ({
    id: String(l._id),
    name: l.name,
    phone: maskPhone(l.phone),
    email: maskEmail(l.email),
    country: l.country,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <PortalClient
      partner={{
        name: partner.name,
        slug: partner.slug,
        loginId: partner.loginId ?? "",
        telegramLink: partner.telegramLink,
        whatsappGroupLink: partner.whatsappGroupLink ?? "",
        tagline: partner.tagline ?? "",
        mentorBio: partner.mentorBio ?? "",
        logoUrl: partner.logoUrl ?? "",
        primaryColor: partner.theme?.primaryColor ?? "#3b36e0",
      }}
      stats={{ total, today, week, byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.n])) }}
      leads={leads}
      truncated={total > LEAD_LIMIT}
    />
  );
}
