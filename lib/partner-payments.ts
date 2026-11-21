import { dbConnect } from "./db";
import { Lead } from "./models/Lead";
import { Partner } from "./models/Partner";
import { fetchTxns, isSalesDbConfigured, phoneForms, phoneKey, shareOf } from "./partner-revenue";

/** One payment from the Sales CRM, tied to the partner lead it came from. Admin-only (unmasked contact details). */
export interface PaymentRow {
  /** Unique row id: transaction + partner. */
  id: string;
  txnId: string;
  source: "payments" | "webhook";
  kind: string;
  amount: number;
  paidAt: string | null;
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  partnerActive: boolean;
  sharePercent: number;
  /** The partner's share of this payment. */
  share: number;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  leadCreatedAt: string;
  /** The same phone number is also a lead of another partner (the payment is listed under each). */
  shared: boolean;
}

export interface PaymentsDataset {
  available: boolean;
  reason?: "not_configured" | "unreachable";
  rows: PaymentRow[];
  partners: { id: string; name: string; slug: string }[];
}

const CACHE_MS = 60_000;
const g = globalThis as unknown as { _payRowsCache?: { at: number; v: PaymentsDataset } };

/**
 * Every payment that came from a partner's lead: partner leads are read once, the Sales CRM is queried once
 * (read-only `find`), and each transaction is joined to the lead with the same last-10-digit phone.
 * Cached for a minute; `fresh` skips the cache.
 */
export async function getPartnerPayments(fresh = false): Promise<PaymentsDataset> {
  if (!isSalesDbConfigured()) return { available: false, reason: "not_configured", rows: [], partners: [] };
  const hit = g._payRowsCache;
  if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.v;

  try {
    await dbConnect();
    const partners = await Partner.find({}).select("name slug isActive sharePercent").sort({ name: 1 }).lean();
    const byId = new Map(partners.map((p) => [String(p._id), p]));
    const bySlug = new Map(partners.map((p) => [p.slug, p]));

    const leads = await Lead.find({ $or: [{ partnerId: { $ne: null } }, { partnerSlug: { $nin: ["", null] } }] })
      .select("name phone email partnerId partnerSlug createdAt")
      .sort({ createdAt: 1 })
      .lean();

    // phone key -> one lead per partner (the earliest sign-up)
    type L = { id: string; name: string; phone: string; email: string; createdAt: Date };
    const byKey = new Map<string, Map<string, L>>();
    const phones: string[] = [];
    for (const l of leads) {
      const key = phoneKey(l.phone);
      const partner = (l.partnerId && byId.get(String(l.partnerId))) || bySlug.get(l.partnerSlug);
      if (!key || !partner) continue;
      let per = byKey.get(key);
      if (!per) {
        per = new Map();
        byKey.set(key, per);
        phones.push(String(l.phone));
      }
      const pid = String(partner._id);
      if (!per.has(pid)) per.set(pid, { id: String(l._id), name: l.name, phone: l.phone, email: l.email, createdAt: l.createdAt });
    }

    const txns = byKey.size ? await fetchTxns(new Set(byKey.keys()), phoneForms(phones)) : [];
    const rows: PaymentRow[] = [];
    for (const t of txns) {
      const per = byKey.get(t.key10);
      if (!per) continue;
      for (const [pid, lead] of per) {
        const p = byId.get(pid)!;
        const sharePercent = p.sharePercent ?? 0;
        rows.push({
          id: `${t.id}:${pid}`,
          txnId: t.id,
          source: t.source,
          kind: t.kind,
          amount: t.amount,
          paidAt: t.paidAt ? new Date(t.paidAt).toISOString() : null,
          partnerId: pid,
          partnerName: p.name,
          partnerSlug: p.slug,
          partnerActive: p.isActive,
          sharePercent,
          share: shareOf(t.amount, sharePercent),
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadEmail: lead.email,
          leadCreatedAt: lead.createdAt.toISOString(),
          shared: per.size > 1,
        });
      }
    }
    const value: PaymentsDataset = {
      available: true,
      rows,
      partners: partners.map((p) => ({ id: String(p._id), name: p.name, slug: p.slug })),
    };
    g._payRowsCache = { at: Date.now(), v: value };
    return value;
  } catch (e) {
    console.error("[partner-payments] Sales DB read failed:", e);
    return { available: false, reason: "unreachable", rows: [], partners: [] };
  }
}

export interface PaymentFilters {
  q: string;
  partner: string;
  source: "" | "payments" | "webhook";
  from: Date | null;
  to: Date | null;
  min: number | null;
  max: number | null;
  sortField: "paidAt" | "amount" | "share" | "partnerName" | "leadName";
  sortDir: "asc" | "desc";
}

const SORTS = ["paidAt", "amount", "share", "partnerName", "leadName"] as const;

function dateParam(v: string | null, endOfDay: boolean): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+05:30`); // dates are picked in IST
  return Number.isNaN(d.getTime()) ? null : d;
}

function numParam(v: string | null): number | null {
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parsePaymentFilters(sp: URLSearchParams): PaymentFilters {
  const sortField = (SORTS as readonly string[]).includes(sp.get("sortField") ?? "") ? (sp.get("sortField") as PaymentFilters["sortField"]) : "paidAt";
  const source = sp.get("source");
  return {
    q: (sp.get("q") ?? "").trim().slice(0, 80).toLowerCase(),
    partner: (sp.get("partner") ?? "").slice(0, 40),
    source: source === "payments" || source === "webhook" ? source : "",
    from: dateParam(sp.get("from"), false),
    to: dateParam(sp.get("to"), true),
    min: numParam(sp.get("min")),
    max: numParam(sp.get("max")),
    sortField,
    sortDir: sp.get("sortOrder") === "asc" ? "asc" : "desc",
  };
}

export interface PaymentsSummary {
  revenue: number;
  share: number;
  payments: number;
  payingCustomers: number;
  partners: number;
}

/** Filters, sorts and totals the rows (in memory: the dataset is the paid leads only). */
export function applyPaymentFilters(rows: PaymentRow[], f: PaymentFilters): { rows: PaymentRow[]; summary: PaymentsSummary } {
  const digits = f.q.replace(/\D/g, "");
  const out = rows.filter((r) => {
    if (f.partner && r.partnerId !== f.partner) return false;
    if (f.source && r.source !== f.source) return false;
    if (f.min !== null && r.amount < f.min) return false;
    if (f.max !== null && r.amount > f.max) return false;
    if (f.from || f.to) {
      if (!r.paidAt) return false;
      const t = new Date(r.paidAt).getTime();
      if (f.from && t < f.from.getTime()) return false;
      if (f.to && t > f.to.getTime()) return false;
    }
    if (f.q) {
      const hay = `${r.leadName} ${r.leadEmail} ${r.txnId} ${r.partnerName} ${r.partnerSlug}`.toLowerCase();
      const phoneHit = digits.length >= 4 && r.leadPhone.replace(/\D/g, "").includes(digits);
      if (!hay.includes(f.q) && !phoneHit) return false;
    }
    return true;
  });

  const dir = f.sortDir === "asc" ? 1 : -1;
  out.sort((a, b) => {
    let c: number;
    if (f.sortField === "paidAt") {
      // payments without a date always go last
      if (!a.paidAt || !b.paidAt) return a.paidAt ? -1 : b.paidAt ? 1 : 0;
      c = a.paidAt < b.paidAt ? -1 : a.paidAt > b.paidAt ? 1 : 0;
    } else if (f.sortField === "amount" || f.sortField === "share") c = a[f.sortField] - b[f.sortField];
    else c = a[f.sortField].localeCompare(b[f.sortField], undefined, { sensitivity: "base" });
    return c * dir || (a.id < b.id ? -1 : 1);
  });

  const customers = new Set<string>();
  const partners = new Set<string>();
  let revenue = 0;
  let share = 0;
  for (const r of out) {
    revenue += r.amount;
    share += r.share;
    customers.add(phoneKey(r.leadPhone));
    partners.add(r.partnerId);
  }
  return { rows: out, summary: { revenue, share, payments: out.length, payingCustomers: customers.size, partners: partners.size } };
}
