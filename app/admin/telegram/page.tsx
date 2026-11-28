"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, PageHeader, Textarea, type BadgeVariant } from "@/components/admin/AdminPrimitives";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";

type Status = "generating" | "pending_approval" | "sending" | "sent" | "rejected" | "failed" | "expired";

interface BroadcastRow {
  _id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  deliveryCount: number;
  counts: Partial<Record<Status, number>>;
  autoApprovedCount: number;
}

interface DeliveryRow {
  _id: string;
  partner: string;
  group: string;
  style: string;
  status: Status;
  autoApproved: boolean;
  preview: string | null;
  error: string | null;
  failedStage: "generate" | "send" | null;
  sentAt: string | null;
}

const STATUS: Record<Status, { label: string; variant: BadgeVariant }> = {
  generating: { label: "Generating", variant: "mute" },
  pending_approval: { label: "Awaiting partner", variant: "gold" },
  sending: { label: "Sending", variant: "accent" },
  sent: { label: "Sent", variant: "up" },
  rejected: { label: "Rejected", variant: "mute" },
  failed: { label: "Failed", variant: "down" },
  expired: { label: "Expired", variant: "mute" },
};
const ORDER: Status[] = ["generating", "pending_approval", "sending", "sent", "rejected", "failed", "expired"];
const MAX = 4000;
const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function TelegramBroadcastsPage() {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [rows, setRows] = useState<BroadcastRow[]>([]);
  const [targets, setTargets] = useState({ groups: 0, partners: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/telegram/broadcasts", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRows(data.broadcasts);
        setTargets(data.targets);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keep the admin view in sync while previews are being generated, reviewed, or posted.
  const active = rows.some((r) =>
    (r.counts.generating ?? 0) > 0 || (r.counts.pending_approval ?? 0) > 0 || (r.counts.sending ?? 0) > 0
  );
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [active, load]);

  const create = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/telegram/broadcasts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(
          data.deliveries > 0 ? `Generating ${data.deliveries} previews. Partners review each message before posting or auto-approve future previews.` : "Saved, but no partner has a connected group yet.",
          data.deliveries > 0 ? "success" : "info"
        );
        setText("");
        await load();
      } else showToast(data.error ?? "Could not create the broadcast.", "error");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Telegram broadcasts"
        description="Write one message. Each partner gets a version in their own style to review and approve, or they can opt into auto-approval for future previews."
      />

      <Card className="space-y-4">
        <Field label="Message" hint={`${text.length}/${MAX}`}>
          <Textarea rows={6} maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write the message for all partners…" />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-cell text-mute">
            Goes to {targets.groups} connected {targets.groups === 1 ? "group" : "groups"} of {targets.partners} {targets.partners === 1 ? "partner" : "partners"}.
          </p>
          <Button onClick={() => setConfirming(true)} disabled={!text.trim() || sending} loading={sending} icon={<Send className="size-4" aria-hidden />}>
            Create previews
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="font-semibold text-ink">Recent broadcasts</h2>
          <Button variant="ghost" size="sm" onClick={() => void load()} icon={<RefreshCw className="size-4" aria-hidden />}>
            Refresh
          </Button>
        </div>
        {loading ? (
          <p className="p-10 text-center text-mute">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No broadcasts yet" description="Your first message will show up here with its delivery status per partner." />
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {rows.map((r) => (
              <li key={r._id}>
                <button type="button" onClick={() => setOpen(r._id)} className="block w-full px-5 py-4 text-left transition hover:bg-alt">
                  <p className="line-clamp-2 whitespace-pre-wrap break-words text-cell text-ink">{r.text}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-meta text-mute">
                    <span>{fmt(r.createdAt)} · {r.createdBy} · {r.deliveryCount} deliveries</span>
                    {ORDER.filter((s) => r.counts[s]).map((s) => (
                      <Badge key={s} variant={STATUS[s].variant}>
                        {STATUS[s].label} {r.counts[s]}
                      </Badge>
                    ))}
                    {r.autoApprovedCount > 0 && <Badge variant="accent">Auto-approved {r.autoApprovedCount}</Badge>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirming}
        title="Create previews for all partners?"
        message={`A rewrite is generated for ${targets.groups} groups, a few seconds apart. Partners who have not opted into auto-approval must approve each preview before it is posted.`}
        confirmLabel="Create previews"
        variant="primary"
        loading={sending}
        onConfirm={create}
        onCancel={() => setConfirming(false)}
      />

      {open && <BroadcastDrawer id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </div>
  );
}

function BroadcastDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => Promise<void> }) {
  const { showToast } = useToast();
  const [data, setData] = useState<{ broadcast: { text: string; createdAt: string }; deliveries: DeliveryRow[] } | null>(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/telegram/broadcasts/${id}`, { cache: "no-store" });
    const json = await res.json();
    if (res.ok && json.ok) setData(json);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = data?.deliveries.some((d) =>
    d.status === "generating" || d.status === "pending_approval" || d.status === "sending"
  );
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [active, load]);

  const failedRewrites = data?.deliveries.filter((d) => d.status === "failed" && d.failedStage === "generate").length ?? 0;

  const retry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/admin/telegram/broadcasts/${id}/retry`, { method: "POST" });
      const json = await res.json();
      showToast(res.ok && json.ok ? `Retrying ${json.requeued} previews.` : json.error ?? "Could not retry.", res.ok && json.ok ? "success" : "error");
      await Promise.all([load(), onChanged()]);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title="Broadcast deliveries">
      {!data ? (
        <p className="p-6 text-mute">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="whitespace-pre-wrap break-words rounded-xl border border-hairline bg-bg p-4 text-cell text-ink">{data.broadcast.text}</div>
          {failedRewrites > 0 && (
            <Button variant="secondary" onClick={retry} loading={retrying} icon={<RefreshCw className="size-4" aria-hidden />}>
              Retry {failedRewrites} failed {failedRewrites === 1 ? "preview" : "previews"}
            </Button>
          )}
          {data.deliveries.length === 0 && <p className="text-cell text-mute">No partner had a connected group when this was created.</p>}
          {data.deliveries.map((d) => (
            <div key={d._id} className="space-y-2 rounded-xl border border-hairline p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{d.partner}</p>
                  <p className="truncate text-meta text-mute">{d.group} · {d.style}</p>
                </div>
                <Badge variant={STATUS[d.status].variant}>{STATUS[d.status].label}</Badge>
              </div>
              {d.autoApproved && <Badge variant="accent">Auto-approved by partner</Badge>}
              {d.preview && <p className="line-clamp-4 whitespace-pre-wrap break-words text-cell text-mute">{d.preview}</p>}
              {d.error && <p className="text-meta text-down">{d.failedStage === "send" ? "Send" : "Rewrite"} error: {d.error}</p>}
              {d.sentAt && <p className="text-meta text-mute">Sent {fmt(d.sentAt)}</p>}
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
