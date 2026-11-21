import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { partnerOr401 } from "@/lib/partner-auth";
import { getPartnerRevenue } from "@/lib/partner-revenue";
import { buildPortalLeadFilter, revenueForPhone } from "@/lib/partner-leads";
import { maskEmail, maskPhone } from "@/lib/mask";

const MAX_ROWS = 20000;

/** CSV cell: quoted, and neutralised against spreadsheet formula injection (names come from a public form). */
function cell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Same filters as the table; contact details stay masked in the file too. */
export async function GET(req: Request): Promise<Response> {
  const partner = await partnerOr401();
  if (partner instanceof Response) return partner;

  const sp = new URL(req.url).searchParams;
  const revenue = await getPartnerRevenue(partner);
  const { filter, sort } = buildPortalLeadFilter(partner, sp, revenue);

  await dbConnect();
  const rows = await Lead.find(filter as never)
    .select("name phone email country status createdAt")
    .sort(sort)
    .limit(MAX_ROWS)
    .lean();

  const header = ["Date (UTC)", "Name", "Phone (masked)", "Email (masked)", "Country", "Status", ...(revenue.available ? ["Revenue (INR)"] : [])];
  const lines = rows.map((l) =>
    [
      l.createdAt.toISOString(),
      l.name,
      maskPhone(l.phone),
      maskEmail(l.email),
      l.country,
      l.status,
      ...(revenue.available ? [revenueForPhone(revenue, l.phone)] : []),
    ]
      .map(cell)
      .join(",")
  );

  return new Response("﻿" + header.map(cell).join(",") + "\n" + lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${partner.slug}_leads_${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
