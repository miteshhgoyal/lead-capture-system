import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { Lead } from "@/lib/models/Lead";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [partners, totalLeadsCount] = await Promise.all([
      Partner.find({}).sort({ createdAt: -1 }).lean(),
      Lead.countDocuments({}),
    ]);

    // Aggregate stats per partnerSlug
    const statsAgg = await Lead.aggregate([
      {
        $group: {
          _id: "$partnerSlug",
          name: { $first: "$partnerName" },
          total: { $sum: 1 },
          last7Days: {
            $sum: { $cond: [{ $gte: ["$createdAt", sevenDaysAgo] }, 1, 0] },
          },
          last30Days: {
            $sum: { $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, 1, 0] },
          },
          joined: {
            $sum: { $cond: [{ $eq: ["$status", "joined"] }, 1, 0] },
          },
          contacted: {
            $sum: { $cond: [{ $eq: ["$status", "contacted"] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map<string, any>();
    for (const s of statsAgg) {
      if (s._id) statsMap.set(s._id, s);
    }

    // Build performance rows for all partners
    const rows = partners.map((p) => {
      const s = statsMap.get(p.slug) || {
        total: 0,
        last7Days: 0,
        last30Days: 0,
        joined: 0,
        contacted: 0,
      };

      const sharePct = totalLeadsCount > 0 ? Math.round((s.total / totalLeadsCount) * 100) : 0;
      const conversionRate = s.total > 0 ? Math.round((s.joined / s.total) * 100) : 0;

      return {
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        isActive: p.isActive,
        logoUrl: p.logoUrl,
        totalLeads: s.total,
        last7Days: s.last7Days,
        last30Days: s.last30Days,
        joinedCount: s.joined,
        contactedCount: s.contacted,
        sharePct,
        conversionRate,
      };
    });

    // Also include direct if it has leads
    const directStats = statsMap.get("direct");
    if (directStats && directStats.total > 0) {
      const sharePct =
        totalLeadsCount > 0 ? Math.round((directStats.total / totalLeadsCount) * 100) : 0;
      const conversionRate =
        directStats.total > 0 ? Math.round((directStats.joined / directStats.total) * 100) : 0;

      rows.push({
        _id: "direct",
        name: "Direct Website (Organic)",
        slug: "direct",
        isActive: true,
        logoUrl: undefined,
        totalLeads: directStats.total,
        last7Days: directStats.last7Days,
        last30Days: directStats.last30Days,
        joinedCount: directStats.joined,
        contactedCount: directStats.contacted,
        sharePct,
        conversionRate,
      });
    }

    // Sort by total leads descending
    rows.sort((a, b) => b.totalLeads - a.totalLeads);

    return NextResponse.json({
      ok: true,
      totalLeadsCount,
      performance: rows,
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/performance] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch performance stats" },
      { status: 500 }
    );
  }
}
