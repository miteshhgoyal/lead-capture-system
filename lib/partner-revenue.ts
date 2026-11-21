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

const g = globalThis as unknown as { _revCache?: Map<string, { at: number; v: PartnerRevenue }> };
const cache = (g._revCache ??= new Map());

interface Txn {
  key10: string;
  amount: number;
  paidAt: Date | null;
}

/**
 * Revenue that came from a partner's leads: lead phone numbers are matched against the Sales CRM's
 * `payments` (status SUCCESS) and `webhookevents` (verified, non-refunded purchases), and the two are
 * unioned by transaction id so a payment that sits in both is counted once.
 * Read-only. Cached for a minute per partner.
 */
export async function getPartnerRevenue(partner: { _id: unknown; slug: string }): Promise<PartnerRevenue> {
  if (!isSalesDbConfigured()) return { ...EMPTY, available: false, reason: "not_configured" };

  const cacheKey = String(partner._id);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.v;

  try {
    await dbConnect();
    const leads = await Lead.find(partnerLeadMatch(partner) as never).select("phone").lean();

    const idsByKey = new Map<string, string[]>();
    const forms = new Set<string>();
    for (const l of leads) {
      const k = phoneKey(l.phone);
      if (!k) continue;
      (idsByKey.get(k) ?? idsByKey.set(k, []).get(k)!).push(String(l._id));
      const digits = String(l.phone).replace(/\D/g, "");
      forms.add(String(l.phone));
      forms.add(digits);
      forms.add(`+${digits}`);
      forms.add(k);
    }
    if (idsByKey.size === 0) {
      cache.set(cacheKey, { at: Date.now(), v: EMPTY });
      return EMPTY;
    }

    const db = await getSalesDb();
    const txns = new Map<string, Txn>();
    const keyOf = (...phones: unknown[]) => phones.map(phoneKey).find((k) => k && idsByKey.has(k)) ?? "";
    const list = [...forms];

    const payments: Record<string, unknown>[] = [];
    const webhooks: Record<string, unknown>[] = [];
    for (let i = 0; i < list.length; i += CHUNK) {
      const chunk = list.slice(i, i + CHUNK);
      const [p, w] = await Promise.all([
        db
          .collection("payments")
          .find(
            { status: "SUCCESS", $or: [{ leadPhone: { $in: chunk } }, { memberPhone: { $in: chunk } }] },
            { projection: { transactionId: 1, amount: 1, paidAt: 1, leadPhone: 1, memberPhone: 1 } }
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

    // 1) payments are the source of truth
    for (const d of payments) {
      const amount = Number(d.amount);
      const key10 = keyOf(d.leadPhone, d.memberPhone);
      if (!key10 || !Number.isFinite(amount) || amount <= 0) continue;
      const key = (d.transactionId as string) || `p:${String(d._id)}`;
      if (!txns.has(key)) txns.set(key, { key10, amount, paidAt: (d.paidAt as Date) ?? null });
    }

    // 2) webhook events add whatever payments does not have yet (same transaction id = same payment)
    for (const d of webhooks) {
      const payload = (d.payload ?? {}) as Record<string, unknown>;
      const amount = Number(d.amount);
      const key10 = keyOf(payload.phone, payload.buyer_phone);
      if (!key10 || !Number.isFinite(amount) || amount <= 0) continue;
      const refund = String(payload.refund_status ?? "none").toLowerCase();
      if (refund !== "none" && refund !== "") continue;
      if (String(payload.payment_verified ?? "true").toLowerCase() === "false") continue;
      const key =
        (payload.transaction_id as string) ||
        String(d.dedupeKey ?? "").replace(/^[^:]+:/, "") ||
        `w:${String(d._id)}`;
      if (!txns.has(key)) txns.set(key, { key10, amount, paidAt: (d.paidAt as Date) ?? null });
    }

    const byPhone: Record<string, PaidInfo> = {};
    let totalRevenue = 0;
    for (const t of txns.values()) {
      const cur = (byPhone[t.key10] ??= { amount: 0, txns: 0, lastPaidAt: null });
      cur.amount += t.amount;
      cur.txns += 1;
      const iso = t.paidAt ? new Date(t.paidAt).toISOString() : null;
      if (iso && (!cur.lastPaidAt || iso > cur.lastPaidAt)) cur.lastPaidAt = iso;
      totalRevenue += t.amount;
    }

    const value: PartnerRevenue = {
      available: true,
      totalRevenue,
      transactions: txns.size,
      payingCustomers: Object.keys(byPhone).length,
      byPhone,
      payingLeadIds: Object.keys(byPhone).flatMap((k) => idsByKey.get(k) ?? []),
    };
    cache.set(cacheKey, { at: Date.now(), v: value });
    return value;
  } catch (e) {
    console.error("[partner-revenue] Sales DB read failed:", e);
    return { ...EMPTY, available: false, reason: "unreachable" };
  }
}

export const shareOf = (total: number, percent?: number | null): number =>
  Math.round((total * Math.min(100, Math.max(0, Number(percent) || 0))) / 100);
