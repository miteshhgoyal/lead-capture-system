"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { Badge, Button, Card, Input, Skeleton, Switch } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";
import { api, fmt } from "./api";

interface Def { key: string; type: "bool" | "int" | "enum" | "idlist"; group: string; label: string; help: string; options?: string[]; min?: number; max?: number; dangerous?: boolean }
type Values = Record<string, boolean | number | string | string[]>;
interface Audit { id: string; actor: string; action: string; key?: string; oldValue: unknown; newValue: unknown; ip?: string; createdAt: string }
interface Readiness { items: { key: string; label: string; present: boolean; required: boolean; hint?: string }[]; ready: boolean; mock: boolean; stats: { lastWebhookAt: string | null; lastSentAt: string | null; queueDepth: number; failedJobs: number; tokensExpiringSoon: number; graphVersion: string } }
interface Acc { id: string; platform: string; username: string; owner: string; ownerId: string; status: string; tokenExpiresAt: string | null }

const TABS = ["Feature toggles", "Readiness", "Accounts", "Logs", "Limits", "Danger zone"] as const;
const GROUPS: Record<string, string> = { master: "Master switch", platforms: "Platforms", triggers: "Triggers", features: "Features", safety: "Safety", rollout: "Rollout" };
const selectCls = "rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink";

export function AdminConsole() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Feature toggles");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab === t ? "border-accent bg-accent/10 text-accent" : "border-hairline text-mute hover:text-ink"}`}>{t}</button>)}</div>
      {tab === "Feature toggles" && <Toggles mode="toggles" toast={showToast} />}
      {tab === "Limits" && <Toggles mode="limits" toast={showToast} />}
      {tab === "Readiness" && <ReadinessTab />}
      {tab === "Accounts" && <AccountsTab toast={showToast} />}
      {tab === "Logs" && <LogsTab toast={showToast} />}
      {tab === "Danger zone" && <DangerTab toast={showToast} />}
    </div>
  );
}

type Toast = (m: string, t?: "success" | "error" | "info") => void;

function Toggles({ mode, toast }: { mode: "toggles" | "limits"; toast: Toast }) {
  const [defs, setDefs] = useState<Def[]>([]);
  const [values, setValues] = useState<Values>({});
  const [audit, setAudit] = useState<Audit[]>([]);
  const [production, setProduction] = useState(true);
  const [missing, setMissing] = useState<{ key: string; label: string }[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const r = await api<{ defs: Def[]; values: Values; audit: Audit[]; production: boolean }>("settings", { admin: true });
    if (r.ok) { setDefs(r.data.defs); setValues(r.data.values); setAudit(r.data.audit); setProduction(r.data.production); setLoaded(true); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save = async (key: string, value: unknown, override = false) => {
    const r = await api<{ missing?: { key: string; label: string }[] }>("settings", { method: "PUT", body: { key, value, override }, admin: true });
    if (!r.ok) { if (r.status === 409 && r.data.missing) setMissing(r.data.missing); toast(r.data.error ?? "Failed", "error"); return; }
    setMissing(null); toast("Saved"); void load();
  };
  const toggle = async (d: Def, v: boolean) => {
    if (d.dangerous && !window.confirm(v ? `Turn ON "${d.label}"?` : `Turn OFF "${d.label}"? ${d.key === "autodm.enabled" ? "The whole AutoDM feature goes dark for all users." : "No messages will be sent until it is turned on again."}`)) return;
    void save(d.key, v);
  };
  if (!loaded) return <Skeleton className="h-64" />;

  const shown = defs.filter((d) => (mode === "limits" ? d.group === "limits" || d.group === "retention" : d.group !== "limits" && d.group !== "retention"));
  const groups = [...new Set(shown.map((d) => d.group))];
  return (
    <div className="space-y-5">
      {missing && (
        <Card className="space-y-2 border-down/40 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-down"><AlertTriangle className="size-4" aria-hidden /> AutoDM cannot be turned on yet. Missing:</div>
          <ul className="list-disc pl-5 text-sm text-mute">{missing.map((m) => <li key={m.key}><code className="text-xs">{m.key}</code> – {m.label}</li>)}</ul>
          {!production && <Button size="sm" variant="secondary" type="button" onClick={() => window.confirm("Developer override: turn AutoDM on although envs are missing? (non-production only)") && void save("autodm.enabled", true, true)}>Developer override</Button>}
        </Card>)}
      {groups.map((g) => (
        <Card key={g} className="space-y-4 p-5"><div className="text-xs font-semibold uppercase tracking-wide text-mute">{mode === "limits" ? (g === "limits" ? "Limits" : "Retention") : GROUPS[g]}</div>
          {shown.filter((d) => d.group === g).map((d) => (
            <div key={d.key} className="space-y-1.5 border-t border-hairline pt-4 first:border-0 first:pt-0">
              {d.type === "bool" ? <Switch checked={values[d.key] === true} onChange={(v) => toggle(d, v)} label={d.label} description={d.help} />
                : <div className="space-y-1.5"><div className="text-sm font-medium">{d.label}</div><div className="text-xs text-mute">{d.help}</div>
                  <div className="flex items-center gap-2">
                    {d.type === "enum" ? <select className={selectCls} value={String(values[d.key])} onChange={(e) => void save(d.key, e.target.value)}>{d.options?.map((o) => <option key={o}>{o}</option>)}</select>
                      : d.type === "int" ? <><Input type="number" className="max-w-40" min={d.min} max={d.max} value={draft[d.key] ?? String(values[d.key])} onChange={(e) => setDraft({ ...draft, [d.key]: e.target.value })} /><Button size="sm" type="button" onClick={() => void save(d.key, Number(draft[d.key] ?? values[d.key]))}>Save</Button></>
                      : <><textarea className="w-full max-w-md rounded-xl border border-hairline bg-bg p-2 font-mono text-xs" rows={3} value={draft[d.key] ?? (values[d.key] as string[]).join("\n")} onChange={(e) => setDraft({ ...draft, [d.key]: e.target.value })} /><Button size="sm" type="button" onClick={() => void save(d.key, (draft[d.key] ?? (values[d.key] as string[]).join("\n")).split(/\s+/).filter(Boolean))}>Save</Button></>}
                  </div></div>}
              <div className="font-mono text-[10px] text-faint">{d.key}</div>
            </div>
          ))}
        </Card>
      ))}
      {mode === "toggles" && <Card className="p-5"><div className="mb-3 text-sm font-semibold">Audit trail</div>
        {audit.length === 0 ? <div className="text-sm text-mute">No changes yet.</div> : <table className="w-full text-xs"><thead><tr className="text-left text-mute"><th className="py-1">When</th><th>Who</th><th>Action</th><th>Key</th><th>Change</th><th>IP</th></tr></thead><tbody>{audit.map((a) => <tr key={a.id} className="border-t border-hairline"><td className="py-1.5 whitespace-nowrap">{fmt(a.createdAt)}</td><td>{a.actor}</td><td>{a.action}</td><td className="font-mono">{a.key}</td><td>{JSON.stringify(a.oldValue)} → {JSON.stringify(a.newValue)}</td><td>{a.ip}</td></tr>)}</tbody></table>}</Card>}
    </div>
  );
}

function ReadinessTab() {
  const [r, setR] = useState<Readiness | null>(null);
  useEffect(() => { void (async () => { const x = await api<Readiness>("readiness", { admin: true }); if (x.ok) setR(x.data as Readiness); })(); }, []);
  if (!r) return <Skeleton className="h-64" />;
  const s = r.stats;
  const stat: [string, string][] = [["Last webhook received", fmt(s.lastWebhookAt)], ["Last successful DM", fmt(s.lastSentAt)], ["Queue depth", String(s.queueDepth)], ["Failed jobs", String(s.failedJobs)], ["Tokens expiring soon", String(s.tokensExpiringSoon)], ["Graph API version", s.graphVersion]];
  return (
    <div className="space-y-5">
      <Card className="space-y-3 p-5"><div className="flex items-center gap-2 text-sm font-semibold">Environment checklist {r.ready ? <Badge variant="up">Ready</Badge> : <Badge variant="down">Not ready</Badge>}{r.mock && <Badge variant="mute">Mock mode</Badge>}</div>
        <ul className="space-y-1.5 text-sm">{r.items.map((i) => <li key={i.key} className="flex items-start gap-2">{i.present ? <Check className="mt-0.5 size-4 text-up" aria-hidden /> : <X className={`mt-0.5 size-4 ${i.required ? "text-down" : "text-faint"}`} aria-hidden />}<span><code className="text-xs">{i.key}</code> <span className="text-mute">– {i.label}{i.required ? "" : " (optional)"}</span>{!i.present && i.hint && <span className="block text-xs text-faint">{i.hint}</span>}</span></li>)}</ul>
        <div className="text-xs text-faint">Values are never shown here.</div></Card>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{stat.map(([l, v]) => <Card key={l} className="p-4"><div className="text-[11px] font-semibold uppercase tracking-wide text-mute">{l}</div><div className="mt-1 text-lg font-semibold">{v}</div></Card>)}</div>
    </div>
  );
}

function AccountsTab({ toast }: { toast: Toast }) {
  const [rows, setRows] = useState<Acc[] | null>(null);
  const load = useCallback(async () => { const r = await api<{ accounts: Acc[] }>("accounts?limit=100", { admin: true }); if (r.ok) setRows(r.data.accounts); }, []);
  useEffect(() => { void load(); }, [load]);
  const act = async (a: Acc, action: string) => { if (action !== "enable" && !window.confirm(`${action} @${a.username}?`)) return; const r = await api(`accounts/${a.id}/${action}`, { method: "POST", admin: true }); toast(r.ok ? "Done" : r.data.error ?? "Failed", r.ok ? "success" : "error"); void load(); };
  if (!rows) return <Skeleton className="h-40" />;
  return <Card className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-mute"><th className="p-3">Account</th><th>Owner</th><th>Platform</th><th>Status</th><th>Token expires</th><th /></tr></thead><tbody>{rows.map((a) => <tr key={a.id} className="border-t border-hairline"><td className="p-3 font-medium">@{a.username}</td><td>{a.owner}</td><td className="capitalize">{a.platform}</td><td><Badge variant={a.status === "active" ? "up" : "down"}>{a.status}</Badge></td><td className="text-mute">{fmt(a.tokenExpiresAt)}</td><td className="space-x-2 p-3 text-right">{a.status === "disabled_by_admin" ? <Button size="sm" type="button" variant="secondary" onClick={() => act(a, "enable")}>Enable</Button> : a.status !== "revoked" && <Button size="sm" type="button" variant="secondary" onClick={() => act(a, "disable")}>Disable</Button>}{a.status !== "revoked" && <Button size="sm" type="button" variant="danger" onClick={() => act(a, "disconnect")}>Force disconnect</Button>}</td></tr>)}{rows.length === 0 && <tr><td className="p-6 text-center text-mute" colSpan={6}>No accounts connected.</td></tr>}</tbody></table></Card>;
}

interface LogRow { id: string; [k: string]: unknown }
function LogsTab({ toast }: { toast: Toast }) {
  const [type, setType] = useState("runs");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LogRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const load = useCallback(async () => {
    setRows(null);
    const p = new URLSearchParams({ type, page: String(page), limit: "25" });
    if (status) p.set("status", status); if (from) p.set("from", from); if (to) p.set("to", to);
    const r = await api<{ rows: LogRow[]; pagination: { total: number } }>(`logs?${p}`, { admin: true });
    if (r.ok) { setRows(r.data.rows); setTotal(r.data.pagination.total); }
  }, [type, status, from, to, page]);
  useEffect(() => { void load(); }, [load]);
  const replay = async (id: string) => { const r = await api<{ status?: string }>(`runs/${id}/replay`, { method: "POST", admin: true }); toast(r.ok ? `Replayed: ${r.data.status}` : r.data.error ?? "Failed", r.ok ? "success" : "error"); void load(); };
  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <select className={selectCls} value={type} onChange={(e) => { setType(e.target.value); setStatus(""); setPage(1); }}><option value="runs">Automation runs</option><option value="events">Webhook events</option><option value="audit">Audit log</option></select>
        {type !== "audit" && <select className={selectCls} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{(type === "runs" ? ["pending", "sent", "failed", "skipped_sending_disabled", "skipped_window_expired", "skipped_already_sent", "skipped_daily_cap", "skipped_feature_disabled", "skipped_account_inactive", "skipped_master_disabled"] : ["received", "queued", "processed", "ignored", "failed"]).map((s) => <option key={s}>{s}</option>)}</select>}
        {type !== "audit" && <><input type="date" className={selectCls} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From" /><input type="date" className={selectCls} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To" /></>}
        <span className="ml-auto text-xs text-mute">{total.toLocaleString()} rows</span>
      </Card>
      {!rows ? <Skeleton className="h-40" /> : (
        <div className="space-y-2">{rows.map((r) => (
          <Card key={r.id} className="space-y-1 p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><Badge variant={String(r.status ?? "").startsWith("skipped") ? "mute" : r.status === "sent" || r.status === "processed" ? "up" : r.status === "failed" ? "down" : "accent"}>{String(r.status ?? r.action)}</Badge><span className="text-mute">{fmt(String(r.createdAt ?? r.receivedAt))}</span><span className="font-medium">{String(r.action ?? r.eventType ?? "")}</span>{Boolean(r.username) && <span>@{String(r.username)}</span>}{Boolean(r.errorCode) && <span className="text-down">{String(r.errorCode)}</span>}{r.status === "skipped_sending_disabled" && <Button size="sm" type="button" variant="secondary" onClick={() => replay(r.id)}>Replay</Button>}</div>
            {Boolean(r.errorMessage || r.error || r.note) && <div className="text-mute">{String(r.errorMessage || r.error || r.note)}</div>}
            {type === "audit" && <div className="text-mute">{String(r.actor)} · {String(r.action)} {String(r.key ?? "")}: {JSON.stringify(r.oldValue)} → {JSON.stringify(r.newValue)}</div>}
            {Boolean(r.payload || r.response) && <details><summary className="cursor-pointer text-accent">Payload (redacted)</summary><pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-alt p-2">{JSON.stringify(r.payload ?? r.response, null, 2)}</pre></details>}
          </Card>))}{rows.length === 0 && <Card className="p-6 text-center text-sm text-mute">Nothing here.</Card>}</div>)}
      <div className="flex justify-between text-xs"><Button size="sm" variant="secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" variant="secondary" type="button" disabled={page * 25 >= total} onClick={() => setPage(page + 1)}>Next</Button></div>
    </div>
  );
}

function DangerTab({ toast }: { toast: Toast }) {
  const [owner, setOwner] = useState("");
  const [confirm, setConfirm] = useState("");
  const pauseAll = async () => { if (!window.confirm("Pause ALL active automations for ALL users?")) return; const r = await api<{ paused: number }>("pause-all", { method: "POST", admin: true }); toast(r.ok ? `Paused ${r.data.paused}` : r.data.error ?? "Failed", r.ok ? "success" : "error"); };
  const purge = async () => { if (!window.confirm("Permanently delete ALL AutoDM data for this partner? This cannot be undone.")) return; const r = await api("purge-user", { method: "POST", body: { ownerId: owner.trim(), confirm: confirm.trim() }, admin: true }); toast(r.ok ? "Data purged" : r.data.error ?? "Failed", r.ok ? "success" : "error"); };
  const runNow = async () => { const r = await api("run-scheduled", { method: "POST", admin: true }); toast(r.ok ? "Scheduler ran" : r.data.error ?? "Failed", r.ok ? "success" : "error"); };
  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-5"><div className="text-sm font-semibold">Run the scheduler now</div><p className="text-xs text-mute">Drains the job queue, refreshes expiring tokens and applies retention. Normally called by your cron every minute.</p><Button type="button" variant="secondary" onClick={runNow}>Run now</Button></Card>
      <Card className="space-y-2 border-down/30 p-5"><div className="text-sm font-semibold text-down">Pause all automations</div><p className="text-xs text-mute">Sets every active automation to paused. Users must reactivate them.</p><Button type="button" variant="danger" onClick={pauseAll}>Pause all automations</Button></Card>
      <Card className="space-y-3 border-down/30 p-5"><div className="text-sm font-semibold text-down">Purge AutoDM data for a partner</div><p className="text-xs text-mute">Deletes accounts, automations, runs, leads, conversations and messages for one partner id.</p>
        <Input placeholder="Partner id (24 characters)" value={owner} onChange={(e) => setOwner(e.target.value)} /><Input placeholder="Type the partner id again to confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="button" variant="danger" disabled={owner.trim().length !== 24 || owner.trim() !== confirm.trim()} onClick={purge}>Purge data</Button></Card>
    </div>
  );
}
