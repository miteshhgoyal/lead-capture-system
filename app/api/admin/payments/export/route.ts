import { requireAdmin } from "@/lib/admin-auth";
import { applyPaymentFilters, getPartnerPayments, parsePaymentFilters } from "@/lib/partner-payments";

const MAX_ROWS = 50000;

/** CSV cell: quoted, and neutralised against spreadsheet formula injection (names come from a public form). */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Admin only. Same filters as the table. */
export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const data = await getPartnerPayments();
  if (!data.available) return new Response("Sales DB is not available", { status: 503 });
  const { rows } = applyPaymentFilters(data.rows, parsePaymentFilters(sp));

  const header = ["Paid at (UTC)", "Partner", "Partner slug", "Lead name", "Lead phone", "Lead email", "Amount (INR)", "Share %", "Partner share (INR)", "Transaction id", "Source", "Plan", "Lead signed up (UTC)"];
  const lines = rows.slice(0, MAX_ROWS).map((r) =>
    [r.paidAt ?? "", r.partnerName, r.partnerSlug, r.leadName, r.leadPhone, r.leadEmail, r.amount, r.sharePercent, r.share, r.txnId, r.source, r.kind, r.leadCreatedAt]
      .map(cell)
      .join(",")
  );
  return new Response("﻿" + header.map(cell).join(",") + "\n" + lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="partner_payments_${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
