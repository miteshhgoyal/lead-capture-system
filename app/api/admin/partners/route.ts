import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { Lead } from "@/lib/models/Lead";
import { PartnerSchema, isReservedSlug } from "@/lib/validation/partner";
import { requireAdmin } from "@/lib/admin-auth";
import { generatePartnerPage } from "@/lib/page-builder/generate";
import { getRevenueForPartners, shareOf } from "@/lib/partner-revenue";

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const partners = await Partner.find({}).sort({ createdAt: -1 }).lean();

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 3600 * 1000);

    // Lead stats per partner slug (replaces the old Partner Performance page)
    const [stats, revenue] = await Promise.all([
      Lead.aggregate([
        {
          $group: {
            _id: "$partnerSlug",
            total: { $sum: 1 },
            last7Days: { $sum: { $cond: [{ $gte: ["$createdAt", sevenDaysAgo] }, 1, 0] } },
            last30Days: { $sum: { $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 1, 0] } },
            joined: { $sum: { $cond: [{ $eq: ["$status", "joined"] }, 1, 0] } },
          },
        },
      ]),
      getRevenueForPartners(partners),
    ]);
    const statMap = new Map<string, { total: number; last7Days: number; last30Days: number; joined: number }>();
    for (const item of stats) if (item._id) statMap.set(item._id, item);

    const enriched = partners.map((p) => {
      const st = statMap.get(p.slug);
      const rev = revenue.byPartner.get(p._id.toString());
      const totalRevenue = rev?.totalRevenue ?? 0;
      const sharePercent = p.sharePercent ?? 0;
      return {
        ...p,
        _id: p._id.toString(),
        leadsCount: st?.total ?? 0,
        last7Days: st?.last7Days ?? 0,
        last30Days: st?.last30Days ?? 0,
        joinedCount: st?.joined ?? 0,
        revenue: totalRevenue,
        payingCustomers: rev?.payingCustomers ?? 0,
        sharePercent,
        shareValue: shareOf(totalRevenue, sharePercent),
      };
    });

    return NextResponse.json({ ok: true, partners: enriched, revenueAvailable: revenue.available, revenueReason: revenue.reason ?? null });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/partners GET] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch partners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const parsed = PartnerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: issue ? issue.message : "Invalid partner data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug.toLowerCase().trim();

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { ok: false, error: `Slug "${slug}" is reserved for system use` },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check uniqueness
    const existing = await Partner.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `A partner with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Randomize the landing page once, at creation. Page views only ever read what is saved here.
    const partner = await Partner.create({
      ...data,
      slug,
      createdBy: admin.email,
      ...generatePartnerPage(data),
    });

    // On-demand revalidation for instant zero-redeploy updates
    try {
      revalidatePath(`/${slug}`);
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors if any
    }

    return NextResponse.json({
      ok: true,
      partner: {
        ...partner.toObject(),
        _id: partner._id.toString(),
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/partners POST] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create partner" }, { status: 500 });
  }
}
