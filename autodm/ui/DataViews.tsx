"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Skeleton } from "@/components/admin/AdminPrimitives";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { api, fmt } from "./api";

const selectCls = "w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink";

/* ── Leads ───────────────────────────────────────────────────────────────── */
interface Lead { id: string; username: string; externalUserId: string; email: string; source: string; capturedAt: string; automation: string; account: string }

export function LeadsView() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [hasEmail, setHasEmail] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const query = useMemo(() => { const p = new URLSearchParams(); if (dq) p.set("q", dq); if (hasEmail) p.set("hasEmail", hasEmail); if (from) p.set("from", from); if (to) p.set("to", to); return p; }, [dq, hasEmail, from, to]);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const p = new URLSearchParams(query); p.set("page", String(page)); p.set("limit", String(limit));
    const r = await api<{ leads: Lead[]; pagination: { total: number } }>(`leads?${p}`);
    if (!r.ok) setError(r.status === 403 || r.status === 404 ? "Lead capture is currently unavailable." : r.data.error ?? "Failed to load leads");
    else { setRows(r.data.leads ?? []); setTotal(r.data.pagination?.total ?? 0); }
    setLoading(false);
  }, [query, page, limit]);
  useEffect(() => { void load(); }, [load]);

  const cols: Column<Lead>[] = [
    { key: "username", header: "Instagram user", render: (r) => <span className="font-medium">{r.username ? `@${r.username}` : r.externalUserId}</span> },
    { key: "email", header: "Email", render: (r) => (r.email ? <span className="font-mono text-xs">{r.email}</span> : <span className="text-faint">–</span>) },
    { key: "source", header: "Source", render: (r) => <Badge variant="mute">{r.source.replace(/_/g, " ")}</Badge> },
    { key: "automation", header: "Automation" },
    { key: "account", header: "Account", render: (r) => <span className="text-mute">@{r.account}</span> },
    { key: "capturedAt", header: "Captured", render: (r) => <span className="whitespace-nowrap text-mute">{fmt(r.capturedAt)}</span> },
  ];
  const clear = () => { setQ(""); setDq(""); setHasEmail(""); setFrom(""); setTo(""); setPage(1); };
  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="mb-1 block text-[11px] font-semibold text-mute">Search</label><Input placeholder="Username or email…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div><label className="mb-1 block text-[11px] font-semibold text-mute">Email</label><select className={selectCls} value={hasEmail} onChange={(e) => { setHasEmail(e.target.value); setPage(1); }}><option value="">All</option><option value="yes">Has email</option><option value="no">No email</option></select></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
          <div className="flex items-center gap-2 text-xs text-mute">Captured: <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="rounded-lg border border-hairline bg-bg px-2 py-1 text-ink" aria-label="From" /> to <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="rounded-lg border border-hairline bg-bg px-2 py-1 text-ink" aria-label="To" /></div>
          <div className="flex items-center gap-2">
            {(q || hasEmail || from || to) && <button type="button" onClick={clear} className="inline-flex items-center gap-1 text-xs font-semibold text-down hover:underline"><X className="size-3.5" aria-hidden /> Clear</button>}
            <a href={`/api/autodm/leads/export?${query}`} download><Button size="sm" variant="secondary" type="button"><Download className="mr-1 inline size-4" aria-hidden /> Export CSV</Button></a>
          </div>
        </div>
      </Card>
      <DataTable<Lead> columns={cols} data={rows} total={total} page={page} pageSize={limit} loading={loading} error={error} getRowId={(r) => r.id} onPageChange={setPage} onPageSizeChange={(n) => { setLimit(n); setPage(1); }} emptyMessage="No leads yet. They appear when an automation replies to someone." />
    </div>
  );
}

/* ── Conversations ───────────────────────────────────────────────────────── */
interface Conv { id: string; username: string; externalUserId: string; lastInboundAt: string | null; lastOutboundAt: string | null; windowOpen: boolean }
interface Msg { id: string; direction: "inbound" | "outbound"; content: string; createdAt: string }

export function ConversationsView() {
  const [list, setList] = useState<Conv[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<{ username: string; messages: Msg[] } | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(async () => { const r = await api<{ conversations: Conv[] }>(`conversations?limit=50${q ? `&q=${encodeURIComponent(q)}` : ""}`); if (!r.ok) setError(r.data.error ?? "Failed to load"); else setList(r.data.conversations ?? []); }, 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { if (!sel) return; void (async () => { const r = await api<{ conversation: { username: string }; messages: Msg[] }>(`conversations/${sel}`); if (r.ok) setThread({ username: r.data.conversation.username, messages: r.data.messages }); })(); }, [sel]);

  if (error) return <Card className="p-6 text-sm text-down">{error}</Card>;
  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <Card className="space-y-3 p-3"><Input placeholder="Search username…" value={q} onChange={(e) => setQ(e.target.value)} />
        {!list ? <Skeleton className="h-40" /> : list.length === 0 ? <div className="p-4 text-center text-sm text-mute">No conversations yet.</div> : (
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">{list.map((c) => <li key={c.id}><button type="button" onClick={() => setSel(c.id)} className={`w-full rounded-xl px-3 py-2 text-left text-sm ${sel === c.id ? "bg-accent/10" : "hover:bg-alt"}`}><div className="font-medium">{c.username ? `@${c.username}` : c.externalUserId}</div><div className="flex items-center gap-2 text-[11px] text-mute">{c.windowOpen ? <span className="text-up">24h window open</span> : <span>window closed</span>}<span>{fmt(c.lastInboundAt ?? c.lastOutboundAt)}</span></div></button></li>)}</ul>)}
      </Card>
      <Card className="min-h-64 p-4">
        {!sel ? <EmptyState title="Select a conversation" description="Read-only history of what was received and sent." /> : !thread ? <Skeleton className="h-40" /> : (
          <div className="space-y-3"><div className="text-sm font-semibold">{thread.username ? `@${thread.username}` : "Conversation"}</div>
            {thread.messages.map((m) => <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : ""}`}><div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.direction === "outbound" ? "bg-accent text-accent-ink" : "bg-alt"}`}>{m.content}<div className="mt-1 text-[10px] opacity-70">{fmt(m.createdAt)}</div></div></div>)}</div>)}
      </Card>
    </div>
  );
}

/* ── Analytics ───────────────────────────────────────────────────────────── */
interface Analytics { days: number; totals: { sent: number; failed: number; skipped: number; leads: number; clicks: number; replies: number }; byDay: { day: string; sent: number; failed: number; skipped: number }[]; byAutomation: { id: string; name: string; sent: number; failed: number; skipped: number }[] }

export function AnalyticsView() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setData(null); void (async () => { const r = await api<Analytics>(`analytics?days=${days}`); if (!r.ok) setError(r.status === 403 || r.status === 404 ? "Analytics is currently unavailable." : r.data.error ?? "Failed to load"); else setData(r.data as Analytics); })(); }, [days]);
  if (error) return <Card className="p-6 text-sm text-down">{error}</Card>;
  if (!data) return <Skeleton className="h-64" />;
  const max = Math.max(1, ...data.byDay.map((d) => d.sent + d.failed + d.skipped));
  const tiles: [string, number][] = [["Sent", data.totals.sent], ["Failed", data.totals.failed], ["Skipped", data.totals.skipped], ["Replies received", data.totals.replies], ["Link clicks", data.totals.clicks], ["Leads", data.totals.leads]];
  return (
    <div className="space-y-5">
      <div className="flex gap-2">{[7, 30, 90].map((d) => <button key={d} type="button" onClick={() => setDays(d)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${days === d ? "border-accent bg-accent/10 text-accent" : "border-hairline text-mute"}`}>Last {d} days</button>)}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{tiles.map(([l, v]) => <Card key={l} className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-mute">{l}</div><div className="mt-1 text-2xl font-semibold tabular-nums">{v.toLocaleString()}</div></Card>)}</div>
      <Card className="space-y-3 p-4"><div className="text-sm font-semibold">Messages per day</div>
        {data.byDay.length === 0 ? <div className="text-sm text-mute">No activity in this period.</div> : (
          <div className="flex h-40 items-end gap-1" role="img" aria-label="Bar chart of messages per day">{data.byDay.map((d) => { const t = d.sent + d.failed + d.skipped; return <div key={d.day} title={`${d.day}: ${d.sent} sent, ${d.failed} failed, ${d.skipped} skipped`} className="flex min-w-[6px] flex-1 flex-col-reverse overflow-hidden rounded-t" style={{ height: `${(t / max) * 100}%` }}><div className="bg-up" style={{ flex: d.sent }} /><div className="bg-down" style={{ flex: d.failed }} /><div className="bg-faint" style={{ flex: d.skipped }} /></div>; })}</div>)}
        <div className="flex gap-4 text-[11px] text-mute"><span><i className="mr-1 inline-block size-2 rounded-sm bg-up" />Sent</span><span><i className="mr-1 inline-block size-2 rounded-sm bg-down" />Failed</span><span><i className="mr-1 inline-block size-2 rounded-sm bg-faint" />Skipped</span></div>
      </Card>
      <Card className="p-4"><div className="mb-2 text-sm font-semibold">By automation</div>
        {data.byAutomation.length === 0 ? <div className="text-sm text-mute">Nothing yet.</div> : <table className="w-full text-sm"><thead><tr className="text-left text-xs text-mute"><th className="py-1">Automation</th><th>Sent</th><th>Failed</th><th>Skipped</th></tr></thead><tbody>{data.byAutomation.map((a) => <tr key={a.id} className="border-t border-hairline"><td className="py-2 font-medium">{a.name}</td><td>{a.sent}</td><td>{a.failed}</td><td>{a.skipped}</td></tr>)}</tbody></table>}
      </Card>
    </div>
  );
}
