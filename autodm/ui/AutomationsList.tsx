"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pause, Play, Pencil, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Skeleton } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";
import { api } from "./api";

interface Auto { id: string; name: string; status: string; triggerType: string; keywordList: string[]; matchType: string; mediaPermalink: string | null; stats: { triggered: number; sent: number; failed: number; skipped: number }; pausedReason: string | null; account: { username: string; platform: string } | null }

export const TRIGGER_LABEL: Record<string, string> = { comment: "Comment on a post/reel", story_reply: "Story reply", story_mention: "Story mention", dm_keyword: "DM keyword", dm_default: "Default DM reply" };
const VARIANT: Record<string, "up" | "mute" | "down" | "accent"> = { active: "up", paused: "mute", draft: "accent", error: "down" };

export function AutomationsList() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Auto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    const r = await api<{ automations: Auto[] }>("automations");
    if (!r.ok) return setError(r.data.error ?? "Could not load automations");
    setItems(r.data.automations ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const act = async (a: Auto, action: "activate" | "pause") => {
    const r = await api(`automations/${a.id}/${action}`, { method: "POST" });
    showToast(r.ok ? (action === "activate" ? "Automation is live" : "Automation paused") : r.data.error ?? "Failed", r.ok ? "success" : "error");
    void load();
  };
  const remove = async (a: Auto) => {
    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
    const r = await api(`automations/${a.id}`, { method: "DELETE" });
    showToast(r.ok ? "Deleted" : r.data.error ?? "Failed", r.ok ? "success" : "error");
    void load();
  };

  if (error) return <Card className="p-6 text-sm text-down">{error}</Card>;
  if (!items) return <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Link href="/autodm/automations/new"><Button type="button" icon={<Plus className="size-4" aria-hidden />}>New automation</Button></Link></div>
      {items.length === 0 ? <EmptyState title="No automations yet" description="Create one to reply automatically when someone comments, replies to your story, or messages you." /> : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{a.name}</span>
                <Badge variant={VARIANT[a.status] ?? "mute"}>{a.status}</Badge>
                <span className="text-xs text-mute">{TRIGGER_LABEL[a.triggerType]}{a.account ? ` · @${a.account.username}` : ""}</span>
                <div className="ml-auto flex items-center gap-2">
                  {a.status === "active" ? <Button size="sm" variant="secondary" type="button" onClick={() => act(a, "pause")} icon={<Pause className="size-3.5" aria-hidden />}>Pause</Button> : <Button size="sm" type="button" onClick={() => act(a, "activate")} icon={<Play className="size-3.5" aria-hidden />}>Activate</Button>}
                  <Link href={`/autodm/automations/${a.id}/edit`}><Button size="sm" variant="secondary" type="button" icon={<Pencil className="size-3.5" aria-hidden />}>Edit</Button></Link>
                  <button type="button" aria-label={`Delete ${a.name}`} onClick={() => remove(a)} className="rounded-lg p-2 text-down hover:bg-down/10"><Trash2 className="size-4" aria-hidden /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-mute">
                {a.keywordList.length > 0 && <span>Keywords: {a.keywordList.join(", ")} ({a.matchType})</span>}
                {a.pausedReason && a.status === "paused" && <span>Paused: {a.pausedReason.replace(/_/g, " ")}</span>}
                <span>Triggered {a.stats.triggered}</span><span>Sent {a.stats.sent}</span><span>Failed {a.stats.failed}</span><span>Skipped {a.stats.skipped}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
