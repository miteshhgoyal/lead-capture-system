import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { requireAdmin } from "@/lib/admin-auth";

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const query: any = {};

    const q = (searchParams.get("q") || "").trim();
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const partnerSlug = searchParams.get("partnerSlug");
    if (partnerSlug && partnerSlug !== "all") query.partnerSlug = partnerSlug;

    const status = searchParams.get("status");
    if (status && status !== "all") query.status = status;

    const country = searchParams.get("country");
    if (country && country !== "all") query.country = country;

    const capital = searchParams.get("capital");
    if (capital && capital !== "all") query.capital = capital;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    await dbConnect();
    const leads = await Lead.find(query).sort({ createdAt: -1 }).lean();

    const headers = [
      "Date (UTC)",
      "Name",
      "Phone",
      "Email",
      "Age",
      "Profession",
      "Capital",
      "Country",
      "Partner Name",
      "Partner Slug",
      "Source",
      "Status",
      "Is Duplicate",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
      "Referrer",
      "IP Address",
      "Device",
      "Notes",
    ];

    const rows = leads.map((l) => [
      escapeCsvCell(l.createdAt ? l.createdAt.toISOString() : ""),
      escapeCsvCell(l.name),
      escapeCsvCell(l.phone),
      escapeCsvCell(l.email),
      escapeCsvCell(l.age),
      escapeCsvCell(l.profession),
      escapeCsvCell(l.capital),
      escapeCsvCell(l.country),
      escapeCsvCell(l.partnerName),
      escapeCsvCell(l.partnerSlug),
      escapeCsvCell(l.source),
      escapeCsvCell(l.status),
      escapeCsvCell(l.isDuplicate ? "Yes" : "No"),
      escapeCsvCell(l.utm_source || ""),
      escapeCsvCell(l.utm_medium || ""),
      escapeCsvCell(l.utm_campaign || ""),
      escapeCsvCell(l.referrer || ""),
      escapeCsvCell(l.ip || ""),
      escapeCsvCell(l.device || ""),
      escapeCsvCell(l.notes || ""),
    ]);

    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n");

    const filename = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[export leads] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to export leads" }, { status: 500 });
  }
}
