"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Badge, Button, Card, Input } from "@/components/admin/AdminPrimitives";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { formatINR } from "@/lib/format";

interface Row {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  status: string;
  revenue: number;
  createdAt: string;
}

const STATUS: Record<string, { label: string; variant: "accent" | "up" | "down" | "mute" }> = {
  new: { label: "New", variant: "accent" },
  contacted: { label: "Contacted", variant: "mute" },
  joined: { label: "Joined", variant: "up" },
  "not-interested": { label: "Not interested", variant: "down" },
};

const selectCls = "w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink";

export function LeadsClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueAvailable, setRevenueAvailable] = useState(true);

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [paid, setPaid] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState("createdAt");
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
    if (status !== "all") q.set("status", status);
    if (paid !== "all") q.set("paid", paid);
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    q.set("sortField", sortField);
    q.set("sortOrder", sortDir);
    return q;
  }, [debounced, status, paid, startDate, endDate, sortField, sortDir]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams(filterQuery);
      q.set("page", String(page));
      q.set("limit", String(limit));
      const res = await fetch(`/api/partner/leads?${q.toString()}`);
      if (res.status === 401) {
        window.location.href = "/partner/login";
        return;
      }
      const data = (await res.json()) as { ok?: boolean; leads?: Row[]; pagination?: { total: number }; revenueAvailable?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load leads");
      setRows(data.leads ?? []);
      setTotal(data.pagination?.total ?? 0);
      setRevenueAvailable(data.revenueAvailable !== false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [filterQuery, page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(search || status !== "all" || paid !== "all" || startDate || endDate);
  const clear = () => {
    setSearch("");
    setDebounced("");
    setStatus("all");
    setPaid("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const onSort = (field: string) => {
    if (field === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
  };

  const columns: Column<Row>[] = [
    { key: "name", header: "Name", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", header: "Phone", render: (r) => <span className="font-mono text-xs">{r.phone}</span> },
    { key: "email", header: "Email", render: (r) => <span className="font-mono text-xs">{r.email}</span> },
    { key: "country", header: "Country", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => <Badge variant={STATUS[r.status]?.variant ?? "mute"}>{STATUS[r.status]?.label ?? r.status}</Badge>,
    },
    ...(revenueAvailable
      ? [
          {
            key: "revenue",
            header: "Revenue",
            align: "right" as const,
            render: (r: Row) => (r.revenue > 0 ? <span className="font-semibold tabular-nums text-up">{formatINR(r.revenue)}</span> : <span className="text-faint">–</span>),
          },
        ]
      : []),
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-mute">{new Date(r.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-mute">Search</label>
            <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Status</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Payment</label>
            <select value={paid} onChange={(e) => { setPaid(e.target.value); setPage(1); }} disabled={!revenueAvailable} className={`${selectCls} disabled:opacity-50`}>
              <option value="all">All leads</option>
              <option value="yes">Paid</option>
              <option value="no">Not paid</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mute">Date:</span>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="min-w-0 rounded-lg border border-hairline bg-bg px-2 py-1 text-xs text-ink" />
            <span className="text-xs text-mute">to</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="min-w-0 rounded-lg border border-hairline bg-bg px-2 py-1 text-xs text-ink" />
          </div>
          <div className="flex items-center gap-2">
            {hasFilters && (
              <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs font-semibold text-down hover:underline">
                <X className="size-3.5" aria-hidden /> Clear filters
              </button>
            )}
            <a href={`/api/partner/leads/export?${filterQuery.toString()}`} download>
              <Button variant="secondary" size="sm" type="button"><Download className="mr-1 inline size-4" aria-hidden /> Export CSV</Button>
            </a>
          </div>
        </div>
      </Card>

      <DataTable<Row>
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
        emptyMessage={hasFilters ? "No leads match these filters." : "No leads yet. Share your link to get started."}
      />
    </div>
  );
}
