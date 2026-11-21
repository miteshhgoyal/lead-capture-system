import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { applyPaymentFilters, getPartnerPayments, parsePaymentFilters } from "@/lib/partner-payments";

/** Admin only: payments from the Sales CRM that came from partner leads. */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const sp = new URL(req.url).searchParams;
    const data = await getPartnerPayments(sp.get("fresh") === "1");
    const { rows, summary } = applyPaymentFilters(data.rows, parsePaymentFilters(sp));

    const limit = Math.min(100, Math.max(5, Number(sp.get("limit")) || 25));
    const pages = Math.max(1, Math.ceil(rows.length / limit));
    const page = Math.min(pages, Math.max(1, Number(sp.get("page")) || 1));

    return NextResponse.json(
      {
        ok: true,
        available: data.available,
        reason: data.reason ?? null,
        payments: rows.slice((page - 1) * limit, page * limit),
        summary,
        partners: data.partners,
        pagination: { page, limit, total: rows.length, pages },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error: any) {
    if (error?.status === 401) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    console.error("[api/admin/payments GET] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load payments" }, { status: 500 });
  }
}
