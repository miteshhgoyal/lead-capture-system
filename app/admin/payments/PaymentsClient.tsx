"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { Badge, Button, Card, Input, StatTile } from "@/components/admin/AdminPrimitives";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { compactINR, formatINR } from "@/lib/format";
import type { PaymentRow, PaymentsSummary } from "@/lib/partner-payments";

interface ApiResponse {
  ok?: boolean;
  error?: string;
  available?: boolean;
  reason?: "not_configured" | "unreachable" | null;
  payments?: PaymentRow[];
  summary?: PaymentsSummary;
  partners?: { id: string; name: string; slug: string }[];
  pagination?: { total: number };
}

const selectCls = "w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink";
const dateCls = "min-w-0 rounded-lg border border-hairline bg-bg px-2 py-1 text-xs text-ink";
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–";

export function PaymentsClient() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [partners, setPartners] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [partner, setPartner] = useState("");
  const [source, setSource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sortField, setSortField] = useState("paidAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const filterQuery = useMemo(() => {
    const q = new URLSearchParams();
    if (debounced) q.set("q", debounced);
    if (partner) q.set("partner", partner);
    if (source) q.set("source", source);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (min) q.set("min", min);
    if (max) q.set("max", max);
    q.set("sortField", sortField);
    q.set("sortOrder", sortDir);
    return q;
  }, [debounced, partner, source, from, to, min, max, sortField, sortDir]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams(filterQuery);
      q.set("page", String(page));
      q.set("limit", String(limit));
      if (refreshKey > 0) q.set("fresh", "1");
      const res = await fetch(`/api/admin/payments?${q.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load payments");
      setUnavailable(data.available === false ? (data.reason === "not_configured" ? "The Sales DB is not connected (set SALES_DB_URI)." : "The Sales DB could not be reached right now.") : null);
      setRows(data.payments ?? []);
      setSummary(data.summary ?? null);
      setPartners(data.partners ?? []);
      setTotal(data.pagination?.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
    // refreshKey is read only to decide `fresh`; changing it re-runs this effect once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery, page, limit, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(search || partner || source || from || to || min || max);
  const clear = () => {
    setSearch("");
    setDebounced("");
    setPartner("");
    setSource("");
    setFrom("");
    setTo("");
    setMin("");
    setMax("");
    setPage(1);
  };
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const onSort = (field: string) => {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir(field === "partnerName" || field === "leadName" ? "asc" : "desc");
    }
    setPage(1);
  };

  const columns: Column<PaymentRow>[] = [
    { key: "paidAt", header: "Paid on", sortable: true, render: (r) => <span className="whitespace-nowrap text-mute">{fmtDate(r.paidAt)}</span> },
    {
      key: "partnerName",
      header: "Partner",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{r.partnerName}</span>
            {!r.partnerActive && <Badge variant="down">Inactive</Badge>}
          </div>
          <div className="font-mono text-[11px] text-faint">/{r.partnerSlug}</div>
        </div>
      ),
    },
    {
      key: "leadName",
      header: "Lead",
      sortable: true,
      render: (r) => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{r.leadName}</span>
            {r.shared && <span title="This phone number is a lead of more than one partner; the payment is listed under each."><Badge variant="mute">Shared</Badge></span>}
          </div>
          <div className="font-mono text-[11px] text-mute">{r.leadPhone}</div>
          <div className="truncate font-mono text-[11px] text-faint">{r.leadEmail}</div>
        </div>
      ),
    },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => <span className="font-semibold tabular-nums text-up">{formatINR(r.amount)}</span> },
    {
      key: "share",
      header: "Partner share",
      sortable: true,
      align: "right",
      render: (r) =>
        r.sharePercent > 0 ? (
          <div className="tabular-nums">
            <div className="font-semibold">{formatINR(r.share)}</div>
            <div className="text-[11px] text-faint">{r.sharePercent}%</div>
          </div>
        ) : (
          <span className="text-faint">–</span>
        ),
    },
    {
      key: "txnId",
      header: "Transaction",
      render: (r) => (
        <div>
          <div className="max-w-[170px] truncate font-mono text-[11px]" title={r.txnId}>{r.txnId}</div>
          <div className="text-[11px] text-faint">{r.source === "payments" ? "Payments" : "Webhook"}{r.kind ? ` · ${r.kind}` : ""}</div>
        </div>
      ),
    },
    { key: "leadCreatedAt", header: "Lead signed up", render: (r) => <span className="whitespace-nowrap text-mute">{fmtDate(r.leadCreatedAt)}</span> },
  ];

  return (
    <div className="space-y-4">
      {unavailable && <div className="rounded-xl border border-hairline bg-card p-4 text-sm text-mute">{unavailable}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Revenue (filtered)" value={summary ? compactINR(summary.revenue) : "–"} subtext={summary ? formatINR(summary.revenue) : undefined} />
        <StatTile label="Partner share" value={summary ? compactINR(summary.share) : "–"} subtext={summary ? formatINR(summary.share) : undefined} />
        <StatTile label="Payments" value={summary ? summary.payments.toLocaleString() : "–"} subtext={summary ? `${summary.payingCustomers.toLocaleString()} paying customers` : undefined} />
        <StatTile label="Partners" value={summary ? summary.partners.toLocaleString() : "–"} subtext="with payments in this view" />
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-mute">Search</label>
            <Input placeholder="Lead name, phone, email, transaction id or partner…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Partner</label>
            <select value={partner} onChange={(e) => reset(setPartner)(e.target.value)} className={selectCls}>
              <option value="">All partners</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name} (/{p.slug})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Source</label>
            <select value={source} onChange={(e) => reset(setSource)(e.target.value)} className={selectCls}>
              <option value="">Payments + webhook</option>
              <option value="payments">Payments only</option>
              <option value="webhook">Webhook only</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mute">Paid:</span>
            <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} className={dateCls} aria-label="Paid from" />
            <span className="text-xs text-mute">to</span>
            <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} className={dateCls} aria-label="Paid to" />
            <span className="ml-2 text-xs text-mute">Amount ₹</span>
            <input type="number" min={0} inputMode="numeric" placeholder="min" value={min} onChange={(e) => reset(setMin)(e.target.value)} className={`${dateCls} w-24`} aria-label="Minimum amount" />
            <span className="text-xs text-mute">–</span>
            <input type="number" min={0} inputMode="numeric" placeholder="max" value={max} onChange={(e) => reset(setMax)(e.target.value)} className={`${dateCls} w-24`} aria-label="Maximum amount" />
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs font-semibold text-down hover:underline">
                <X className="size-3.5" aria-hidden /> Clear filters
              </button>
            )}
            <Button variant="secondary" size="sm" type="button" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
              <RefreshCw className={`mr-1 inline size-4 ${loading ? "animate-spin" : ""}`} aria-hidden /> Refresh
            </Button>
            <a href={`/api/admin/payments/export?${filterQuery.toString()}`} download>
              <Button variant="secondary" size="sm" type="button"><Download className="mr-1 inline size-4" aria-hidden /> Export CSV</Button>
            </a>
          </div>
        </div>
      </Card>

      <DataTable<PaymentRow>
        columns={columns}
        data={rows}
        total={total}
        page={page}
        pageSize={limit}
        loading={loading}
        error={error}
        sortField={sortField}
        sortDir={sortDir}
        getRowId={(r) => r.id}
        onPageChange={setPage}
        onPageSizeChange={(n) => { setLimit(n); setPage(1); }}
        onSortChange={onSort}
        emptyMessage={hasFilters ? "No payments match these filters." : "No payments from partner leads yet."}
      />
    </div>
  );
}
