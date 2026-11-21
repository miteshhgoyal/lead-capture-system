"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plug, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Skeleton } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";
import { api, fmt } from "./api";

interface Account { id: string; platform: "instagram" | "facebook"; username: string; displayName: string | null; profilePictureUrl: string | null; status: string; tokenExpiresAt: string | null; lastError: string | null; activeAutomations: number }
interface Features { instagram: boolean; facebook: boolean; oauth: boolean; sending: boolean; mock: boolean; limits: { maxAccounts: number } }
interface Note { id: string; message: string; read: boolean; createdAt: string }

const STATUS: Record<string, { label: string; variant: "up" | "down" | "mute" | "gold" }> = {
  active: { label: "Connected", variant: "up" },
  token_expired: { label: "Reconnect needed", variant: "down" },
  disabled_by_admin: { label: "Disabled by admin", variant: "mute" },
  error: { label: "Error", variant: "down" },
};

export function Overview() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [features, setFeatures] = useState<Features | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, f, n] = await Promise.all([api<{ accounts: Account[] }>("accounts"), api<{ features: Features }>("features"), api<{ notifications: Note[] }>("notifications")]);
    if (!a.ok) return setError(a.data.error ?? "Could not load your accounts.");
    setAccounts(a.data.accounts ?? []);
    setFeatures(f.data.features ?? null);
    setNotes(n.data.notifications ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const disconnect = async (a: Account) => {
    if (!window.confirm(`Disconnect @${a.username}? Its automations will be paused.`)) return;
    const r = await api(`accounts/${a.id}`, { method: "DELETE" });
    showToast(r.ok ? "Account disconnected" : r.data.error ?? "Failed", r.ok ? "success" : "error");
    void load();
  };
  const markRead = async () => { await api("notifications/read", { method: "POST" }); void load(); };

  if (error) return <Card className="p-6 text-sm text-down">{error}</Card>;
  if (!accounts) return <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;
  const unread = notes.filter((n) => !n.read);

  return (
    <div className="space-y-6">
      {features?.mock && <Card className="p-4 text-sm text-mute">Mock mode is on: no real Meta account is contacted. Connecting creates a demo account.</Card>}
      {features && !features.sending && <Card className="flex items-center gap-2 p-4 text-sm text-mute"><AlertTriangle className="size-4 text-down" aria-hidden /> Sending is temporarily paused by the administrator. Events are recorded but no messages go out.</Card>}

      {unread.length > 0 && (
        <Card className="space-y-2 p-4">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">Notices</span><button type="button" onClick={markRead} className="text-xs font-semibold text-accent hover:underline">Mark as read</button></div>
          {unread.map((n) => <div key={n.id} className="text-sm text-mute">{n.message} <span className="text-xs text-faint">{fmt(n.createdAt)}</span></div>)}
        </Card>
      )}

      <Card className="space-y-3 p-5">
        <div className="text-sm font-semibold">How AutoDM works</div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-mute">
          <li>Only <strong>Instagram Professional</strong> (Business or Creator) accounts can be connected.</li>
          <li>AutoDM replies <strong>only to people who interact first</strong>: a comment, a story reply/mention, or a message. There are no cold or bulk DMs.</li>
          <li>A comment can get <strong>one private reply within 7 days</strong>. A normal DM reply is allowed <strong>within 24 hours</strong> of the person&apos;s last message.</li>
        </ul>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {features?.instagram && features.oauth && (
          <a href="/api/autodm/connect/instagram"><Button type="button">Connect Instagram</Button></a>
        )}
        {features?.facebook && features.oauth && (
          <a href="/api/autodm/connect/facebook"><Button type="button" variant="secondary">Connect Facebook Page</Button></a>
        )}
        {features && !features.oauth && <span className="text-sm text-mute">New connections are currently disabled.</span>}
        <Link href="/autodm/automations" className="ml-auto text-sm font-semibold text-accent hover:underline">Automations →</Link>
      </div>

      {accounts.length === 0 ? (
        <EmptyState title="No account connected yet" description="Connect your Instagram Professional account to start building automations." icon={<Plug className="size-6" aria-hidden />} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((a) => {
            const st = STATUS[a.status] ?? { label: a.status, variant: "mute" as const };
            const expSoon = a.tokenExpiresAt && new Date(a.tokenExpiresAt).getTime() - Date.now() < 7 * 86400000;
            return (
              <Card key={a.id} className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  {a.profilePictureUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.profilePictureUrl} alt="" className="size-11 rounded-full object-cover" /> : <div className="flex size-11 items-center justify-center rounded-full bg-accent/15 font-bold text-accent">{a.username.slice(0, 1).toUpperCase()}</div>}
                  <div className="min-w-0"><div className="truncate font-semibold">@{a.username}</div><div className="text-xs capitalize text-mute">{a.platform}{a.displayName ? ` · ${a.displayName}` : ""}</div></div>
                  <div className="ml-auto"><Badge variant={st.variant}>{st.label}</Badge></div>
                </div>
                {a.status === "token_expired" && <div className="text-xs text-down">The connection expired. Reconnect to resume your paused automations.</div>}
                {a.status === "active" && expSoon && <div className="text-xs text-down">Connection expires {fmt(a.tokenExpiresAt)} unless it is refreshed automatically.</div>}
                {a.lastError && a.status !== "active" && <div className="text-xs text-mute">{a.lastError}</div>}
                <div className="flex items-center justify-between text-xs text-mute"><span>{a.activeAutomations} active automation{a.activeAutomations === 1 ? "" : "s"}</span>
                  <button type="button" onClick={() => disconnect(a)} className="inline-flex items-center gap-1 font-semibold text-down hover:underline"><Trash2 className="size-3.5" aria-hidden /> Disconnect</button></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
