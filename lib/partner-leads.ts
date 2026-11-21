import { partnerLeadMatch, phoneKey, type PartnerRevenue } from "./partner-revenue";
import { LEAD_STATUS_OPTIONS } from "./validation/lead";

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const SORTABLE = new Set(["createdAt", "name", "status", "country"]);

/**
 * Filters shared by the portal leads table and its CSV export.
 * Search is by NAME only: searching phone/email would let a partner un-mask contact details
 * one digit at a time.
 */
export function buildPortalLeadFilter(
  partner: { _id: unknown; slug: string },
  sp: URLSearchParams,
  revenue: PartnerRevenue
): { filter: Record<string, unknown>; sort: Record<string, 1 | -1> } {
  const and: Record<string, unknown>[] = [partnerLeadMatch(partner)];

  const q = (sp.get("q") || "").trim().slice(0, 60);
  if (q) and.push({ name: { $regex: escapeRegex(q), $options: "i" } });

  const status = sp.get("status");
  if (status && (LEAD_STATUS_OPTIONS as readonly string[]).includes(status)) and.push({ status });

  const range: Record<string, Date> = {};
  const from = sp.get("startDate") ? new Date(sp.get("startDate")!) : null;
  const to = sp.get("endDate") ? new Date(sp.get("endDate")!) : null;
  if (from && !Number.isNaN(from.getTime())) range.$gte = from;
  if (to && !Number.isNaN(to.getTime())) {
    to.setHours(23, 59, 59, 999);
    range.$lte = to;
  }
  if (Object.keys(range).length) and.push({ createdAt: range });

  const paid = sp.get("paid");
  if (revenue.available && (paid === "yes" || paid === "no")) {
    and.push({ _id: paid === "yes" ? { $in: revenue.payingLeadIds } : { $nin: revenue.payingLeadIds } });
  }

  const field = sp.get("sortField") || "createdAt";
  const dir = sp.get("sortOrder") === "asc" ? 1 : -1;
  return { filter: { $and: and }, sort: { [SORTABLE.has(field) ? field : "createdAt"]: dir, _id: -1 } };
}

export const revenueForPhone = (revenue: PartnerRevenue, phone: string): number =>
  revenue.byPhone[phoneKey(phone)]?.amount ?? 0;
