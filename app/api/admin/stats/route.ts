import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { Partner } from "@/lib/models/Partner";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, 90d, all

    await dbConnect();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter date for chart and breakdowns
    let filterDate: Date | null = thirtyDaysAgo;
    if (range === "7d") filterDate = sevenDaysAgo;
    else if (range === "90d") filterDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    else if (range === "all") filterDate = null;

    const matchQuery: any = {};
    if (filterDate) {
      matchQuery.createdAt = { $gte: filterDate };
    }

    const [
      totalLeads,
      todayLeads,
      last7DaysLeads,
      last30DaysLeads,
      statusBreakdown,
      partnerCounts,
      capitalBreakdown,
      professionBreakdown,
      countryBreakdown,
      overTimeData,
    ] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ createdAt: { $gte: todayStart } }),
      Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Lead.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),

      // Status breakdown
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Partner breakdown
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$partnerSlug",
            name: { $first: "$partnerName" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Capital breakdown
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$capital", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Profession breakdown
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$profession", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Country breakdown
      Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Leads over time (grouped by YYYY-MM-DD)
      Lead.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const activePartnersCount = await Partner.countDocuments({ isActive: true });

    return NextResponse.json({
      ok: true,
      metrics: {
        totalLeads,
        todayLeads,
        last7DaysLeads,
        last30DaysLeads,
        activePartnersCount,
      },
      statusBreakdown: statusBreakdown.map((s) => ({ status: s._id || "new", count: s.count })),
      partnerBreakdown: partnerCounts.map((p) => ({
        slug: p._id,
        name: p.name || p._id,
        count: p.count,
        sharePct: totalLeads > 0 ? Math.round((p.count / totalLeads) * 100) : 0,
      })),
      capitalBreakdown: capitalBreakdown.map((c) => ({ capital: c._id || "Unknown", count: c.count })),
      professionBreakdown: professionBreakdown.map((p) => ({
        profession: p._id || "Unknown",
        count: p.count,
      })),
      countryBreakdown: countryBreakdown.map((c) => ({ country: c._id || "Unknown", count: c.count })),
      overTime: overTimeData.map((d) => ({ date: d._id, count: d.count })),
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/stats] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
