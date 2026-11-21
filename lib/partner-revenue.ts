import { dbConnect } from "./db";
import { Lead } from "./models/Lead";
import { getSalesDb, isSalesDbConfigured } from "./sales-db";

/** Lead filter that belongs to a partner: by id, plus older leads that only stored the slug. */
export const partnerLeadMatch = (partner: { _id: unknown; slug: string }) => ({
  $or: [{ partnerId: partner._id }, { partnerSlug: partner.slug }],
});

/** Last 10 digits of any phone format ("+91 98..", "9198..", "98.."); "" when too short to trust. */
export function phoneKey(phone: unknown): string {
  const d = String(phone ?? "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

export interface PaidInfo {
  amount: number;
  txns: number;
  lastPaidAt: string | null;
}

export interface PartnerRevenue {
  /** false when the second DB is not configured or unreachable. */
  available: boolean;
  reason?: "not_configured" | "unreachable";
  totalRevenue: number;
  transactions: number;
  /** Distinct people (phone numbers) that paid. */
  payingCustomers: number;
  /** Keyed by phoneKey(). */
  byPhone: Record<string, PaidInfo>;
  /** Lead ids (strings) whose phone has at least one payment. */
  payingLeadIds: string[];
}

const EMPTY: PartnerRevenue = { available: true, totalRevenue: 0, transactions: 0, payingCustomers: 0, byPhone: {}, payingLeadIds: [] };
const CACHE_MS = 60_000;
const CHUNK = 800;

const g = globalThis as unknown as { _revCache?: Map<string, { at: number; v: unknown }> };
const cache = (g._revCache ??= new Map());

/** One payment, after the union of `payments` and `webhookevents` (one entry per transaction id). */
export interface Txn {
  id: string;
  source: "payments" | "webhook";
  key10: string;
  amount: number;
  paidAt: Date | null;
  /** Payment plan/kind as the CRM labels it (payments only), e.g. "RECURRING_2500". */
  kind: string;
}

/** Every phone spelling the Sales CRM might store for these leads: "+91..", "91..", "98..". */
export function phoneForms(phones: string[]): string[] {
  const forms = new Set<string>();
  for (const phone of phones) {
    const k = phoneKey(phone);
    if (!k) continue;
    const digits = phone.replace(/\D/g, "");
    forms.add(phone);
    forms.add(digits);
    forms.add(`+${digits}`);
    forms.add(k);
  }
  return [...forms];
}

/**
 * The core match. Looks the given phone keys up in the Sales CRM and returns paid totals per phone key.
 * `payments` (status SUCCESS) is the source of truth; `webhookevents` (verified, non-refunded purchases)
 * add what payments lacks. Both are unioned by transaction id, so one payment is counted once.
 * Read-only: `find` with projections only.
 */
async function paidByPhone(keys: Set<string>, forms: string[]): Promise<Record<string, PaidInfo>> {
  const byPhone: Record<string, PaidInfo> = {};
  for (const t of await fetchTxns(keys, forms)) {
    const cur = (byPhone[t.key10] ??= { amount: 0, txns: 0, lastPaidAt: null });
    cur.amount += t.amount;
    cur.txns += 1;
    const iso = t.paidAt ? new Date(t.paidAt).toISOString() : null;
    if (iso && (!cur.lastPaidAt || iso > cur.lastPaidAt)) cur.lastPaidAt = iso;
  }
  return byPhone;
}

/** Every successful transaction for these phone keys, unioned and de-duplicated by transaction id. */
export async function fetchTxns(keys: Set<string>, forms: string[]): Promise<Txn[]> {
  const db = await getSalesDb();
  const txns = new Map<string, Txn>();
  const keyOf = (...phones: unknown[]) => phones.map(phoneKey).find((k) => k && keys.has(k)) ?? "";

  const payments: Record<string, unknown>[] = [];
  const webhooks: Record<string, unknown>[] = [];
  for (let i = 0; i < forms.length; i += CHUNK) {
    const chunk = forms.slice(i, i + CHUNK);
    const [p, w] = await Promise.all([
      db
        .collection("payments")
        .find(
          { status: "SUCCESS", $or: [{ leadPhone: { $in: chunk } }, { memberPhone: { $in: chunk } }] },
          { projection: { transactionId: 1, amount: 1, paidAt: 1, leadPhone: 1, memberPhone: 1, kind: 1 } }
        )
        .toArray(),
      db
        .collection("webhookevents")
        .find(
          { eventType: "purchase", $or: [{ "payload.phone": { $in: chunk } }, { "payload.buyer_phone": { $in: chunk } }] },
          {
            projection: {
              dedupeKey: 1,
              amount: 1,
              paidAt: 1,
              "payload.transaction_id": 1,
              "payload.phone": 1,
              "payload.buyer_phone": 1,
              "payload.refund_status": 1,
              "payload.payment_verified": 1,
            },
          }
        )
        .toArray(),
    ]);
    payments.push(...(p as Record<string, unknown>[]));
    webhooks.push(...(w as Record<string, unknown>[]));
  }

  for (const d of payments) {
    const amount = Number(d.amount);
    const key10 = keyOf(d.leadPhone, d.memberPhone);
    if (!key10 || !Number.isFinite(amount) || amount <= 0) continue;
    const key = (d.transactionId as string) || `p:${String(d._id)}`;
    if (!txns.has(key)) txns.set(key, { id: key, source: "payments", key10, amount, paidAt: (d.paidAt as Date) ?? null, kind: String(d.kind ?? "") });
  }

  for (const d of webhooks) {
    const payload = (d.payload ?? {}) as Record<string, unknown>;
    const amount = Number(d.amount);
    const key10 = keyOf(payload.phone, payload.buyer_phone);
    if (!key10 || !Number.isFinite(amount) || amount <= 0) continue;
    const refund = String(payload.refund_status ?? "none").toLowerCase();
    if (refund !== "none" && refund !== "") continue;
    if (String(payload.payment_verified ?? "true").toLowerCase() === "false") continue;
    const key = (payload.transaction_id as string) || String(d.dedupeKey ?? "").replace(/^[^:]+:/, "") || `w:${String(d._id)}`;
    if (!txns.has(key)) txns.set(key, { id: key, source: "webhook", key10, amount, paidAt: (d.paidAt as Date) ?? null, kind: "" });
  }

  return [...txns.values()];
}

/** One partner's summary out of the paid-by-phone map. */
function summarize(leadsOfPartner: { id: string; key: string }[], paid: Record<string, PaidInfo>): PartnerRevenue {
  const keys = new Set(leadsOfPartner.map((l) => l.key));
  const byPhone: Record<string, PaidInfo> = {};
  let totalRevenue = 0;
  let transactions = 0;
  for (const k of keys) {
    const info = paid[k];
    if (!info) continue;
    byPhone[k] = info;
    totalRevenue += info.amount;
    transactions += info.txns;
  }
  return {
    available: true,
    totalRevenue,
    transactions,
    payingCustomers: Object.keys(byPhone).length,
    byPhone,
    payingLeadIds: leadsOfPartner.filter((l) => byPhone[l.key]).map((l) => l.id),
  };
}

/** Revenue that came from one partner's leads. Cached for a minute. */
export async function getPartnerRevenue(partner: { _id: unknown; slug: string }): Promise<PartnerRevenue> {
  if (!isSalesDbConfigured()) return { ...EMPTY, available: false, reason: "not_configured" };

  const cacheKey = `p:${String(partner._id)}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.v as PartnerRevenue;

  try {
    await dbConnect();
    const leads = await Lead.find(partnerLeadMatch(partner) as never).select("phone").lean();
    const mine = leads.map((l) => ({ id: String(l._id), key: phoneKey(l.phone), phone: String(l.phone) })).filter((l) => l.key);
    if (mine.length === 0) {
      cache.set(cacheKey, { at: Date.now(), v: EMPTY });
      return EMPTY;
    }
    const paid = await paidByPhone(new Set(mine.map((l) => l.key)), phoneForms(mine.map((l) => l.phone)));
    const value = summarize(mine, paid);
    cache.set(cacheKey, { at: Date.now(), v: value });
    return value;
  } catch (e) {
    console.error("[partner-revenue] Sales DB read failed:", e);
    return { ...EMPTY, available: false, reason: "unreachable" };
  }
}

export interface PartnerRevenueRow {
  totalRevenue: number;
  transactions: number;
  payingCustomers: number;
}

/**
 * Revenue for every partner in one pass (admin table): all leads are read once, the Sales CRM is
 * queried once, and the result is split per partner. Keyed by partner id (string).
 */
export async function getRevenueForPartners(
  partners: { _id: unknown; slug: string }[]
): Promise<{ available: boolean; reason?: PartnerRevenue["reason"]; byPartner: Map<string, PartnerRevenueRow> }> {
  const byPartner = new Map<string, PartnerRevenueRow>();
  if (!isSalesDbConfigured()) return { available: false, reason: "not_configured", byPartner };

  const hit = cache.get("all");
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.v as { available: boolean; byPartner: Map<string, PartnerRevenueRow> };

  try {
    await dbConnect();
    const idBySlug = new Map(partners.map((p) => [p.slug, String(p._id)]));
    const leads = await Lead.find({}).select("partnerId partnerSlug phone").lean();

    const perPartner = new Map<string, { id: string; key: string }[]>();
    const allKeys = new Set<string>();
    const allPhones: string[] = [];
    for (const l of leads) {
      const key = phoneKey(l.phone);
      const pid = l.partnerId ? String(l.partnerId) : idBySlug.get(l.partnerSlug);
      if (!key || !pid) continue;
      (perPartner.get(pid) ?? perPartner.set(pid, []).get(pid)!).push({ id: String(l._id), key });
      if (!allKeys.has(key)) {
        allKeys.add(key);
        allPhones.push(String(l.phone));
      }
    }

    const paid = allKeys.size ? await paidByPhone(allKeys, phoneForms(allPhones)) : {};
    for (const [pid, ls] of perPartner) {
      const s = summarize(ls, paid);
      byPartner.set(pid, { totalRevenue: s.totalRevenue, transactions: s.transactions, payingCustomers: s.payingCustomers });
    }
    const value = { available: true, byPartner };
    cache.set("all", { at: Date.now(), v: value });
    return value;
  } catch (e) {
    console.error("[partner-revenue] Sales DB read failed (all partners):", e);
    return { available: false, reason: "unreachable", byPartner };
  }
}

export const shareOf = (total: number, percent?: number | null): number =>
  Math.round((total * Math.min(100, Math.max(0, Number(percent) || 0))) / 100);
