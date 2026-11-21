import { json } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { partnerOr401 } from "@/lib/partner-auth";
import { getPartnerRevenue } from "@/lib/partner-revenue";
import { buildPortalLeadFilter, revenueForPhone } from "@/lib/partner-leads";
import { maskEmail, maskPhone } from "@/lib/mask";

/** Paged, filterable list of this partner's leads (email/phone masked) with revenue per lead. */
export async function GET(req: Request): Promise<Response> {
  const partner = await partnerOr401();
  if (partner instanceof Response) return partner;

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "25", 10) || 25));

  const revenue = await getPartnerRevenue(partner);
  const { filter, sort } = buildPortalLeadFilter(partner, sp, revenue);

  await dbConnect();
  const [rows, total] = await Promise.all([
    Lead.find(filter as never)
      .select("name phone email country status createdAt")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter as never),
  ]);

  return json({
    ok: true,
    leads: rows.map((l) => ({
      id: String(l._id),
      name: l.name,
      phone: maskPhone(l.phone),
      email: maskEmail(l.email),
      country: l.country,
      status: l.status,
      revenue: revenueForPhone(revenue, l.phone),
      createdAt: l.createdAt.toISOString(),
    })),
    revenueAvailable: revenue.available,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  });
}
