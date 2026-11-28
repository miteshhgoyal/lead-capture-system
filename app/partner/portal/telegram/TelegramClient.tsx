"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Link2, Loader2, RefreshCw, Send, Sparkles, Unlink, X } from "lucide-react";
import { Badge, Button, Card, EmptyState, Field, Select, Textarea, type BadgeVariant } from "@/components/admin/AdminPrimitives";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { STYLE_MAX, STYLE_PRESETS, isPresetStyle } from "@/lib/telegram/styles";

export interface GroupView {
  _id: string;
  title: string;
  active: boolean;
  connectedAt: string;
  disconnectedAt: string | null;
  disconnectReason: string | null;
}

export interface DeliveryView {
  _id: string;
  group: string;
  groupActive: boolean;
  original: string;
  preview: string | null;
  unchanged: boolean;
  autoApproved: boolean;
  version: number;
  status: "generating" | "pending_approval" | "sending" | "sent" | "rejected" | "failed" | "expired";
  style: string;
  error: string | null;
  createdAt: string;
  expiresAt: string | null;
  sentAt: string | null;
}

const STATUS: Record<DeliveryView["status"], { label: string; variant: BadgeVariant }> = {
  generating: { label: "Generating", variant: "mute" },
  pending_approval: { label: "Waiting for you", variant: "gold" },
  sending: { label: "Sending", variant: "accent" },
  sent: { label: "Sent", variant: "up" },
  rejected: { label: "Rejected", variant: "mute" },
  failed: { label: "Failed", variant: "down" },
  expired: { label: "Expired", variant: "mute" },
};

const REASONS: Record<string, string> = {
  removed_from_group: "The bot was removed from this group.",
  disconnected_by_partner: "You disconnected this group.",
  bot_removed_or_blocked: "The bot can no longer post in this group.",
  unknown_group: "The bot no longer has access to this group.",
};

const CUSTOM = "__custom__";
const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function timeLeft(iso: string | null): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expiring now";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

async function post(url: string, body?: object): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok && data.ok === true, data };
}
const errorText = (d: Record<string, unknown>, fallback: string) =>
  (typeof d.message === "string" && d.message) || (typeof d.error === "string" && d.error) || fallback;

export function TelegramClient({
  groups,
  deliveries,
  style,
  autoApprove,
}: {
  groups: GroupView[];
  deliveries: DeliveryView[];
  style: string;
  autoApprove: boolean;
}) {
  const router = useRouter();
  const pending = deliveries.filter((d) => d.status === "pending_approval" || d.status === "generating" || d.status === "sending");
  const history = deliveries.filter((d) => !pending.includes(d));

  // Refresh while something is being generated or sent in the background.
  const busy = pending.some((d) => d.status === "generating" || d.status === "sending");
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [busy, router]);

  return (
    <div className="space-y-6">
      <GroupsCard groups={groups} />
      <StyleCard initial={style} autoApprove={autoApprove} />

      <section className="space-y-3">
        <h2 className="font-semibold text-ink">Waiting for approval</h2>
        {pending.length === 0 ? (
          <EmptyState
            icon={<Send className="size-6" aria-hidden />}
            title="Nothing to approve"
            description="When the company sends a message, a version written in your style shows up here for you to approve."
          />
        ) : (
          pending.map((d) => <PendingCard key={d._id} d={d} autoApprove={autoApprove} />)
        )}
      </section>

      <HistoryCard items={history} />
    </div>
  );
}

function GroupsCard({ groups }: { groups: GroupView[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [link, setLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [toDisconnect, setToDisconnect] = useState<GroupView | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const active = groups.filter((g) => g.active);
  const inactive = groups.filter((g) => !g.active);

  // The bot connects in the background: poll for the new group while a link is out.
  useEffect(() => {
    if (!link) return;
    const t = setInterval(() => router.refresh(), 4000);
    const stop = setTimeout(() => setLink(null), Math.max(0, new Date(link.expiresAt).getTime() - Date.now()));
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, [link, router]);

  const connect = async () => {
    setConnecting(true);
    try {
      const { ok, data } = await post("/api/partner/telegram/connect");
      if (!ok) return showToast(errorText(data, "Could not create a connect link."), "error");
      const next = { url: String(data.url), expiresAt: String(data.expiresAt) };
      setLink(next);
      window.open(next.url, "_blank", "noopener");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!toDisconnect) return;
    setDisconnecting(true);
    try {
      const { ok, data } = await post(`/api/partner/telegram/groups/${toDisconnect._id}/disconnect`);
      showToast(ok ? "Group disconnected." : errorText(data, "Could not disconnect."), ok ? "success" : "error");
      if (ok) router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setDisconnecting(false);
      setToDisconnect(null);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink">Telegram groups</h2>
          <p className="text-cell text-mute">Add the bot to a group you are an admin of. It can only post what you approve.</p>
        </div>
        <Button onClick={connect} loading={connecting} icon={<Link2 className="size-4" aria-hidden />}>
          Connect Telegram group
        </Button>
      </div>

      {link && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-cell">
          <p className="text-ink">
            Telegram should open. Pick your group and keep the &quot;Post messages&quot; permission on. This link works once and expires at{" "}
            {new Date(link.expiresAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}.
          </p>
          <a href={link.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-accent">
            Open Telegram <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-cell text-mute">No groups connected yet.</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-xl border border-hairline">
          {[...active, ...inactive].map((g) => (
            <li key={g._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{g.title}</span>
                  <Badge variant={g.active ? "up" : "down"}>{g.active ? "Connected" : "Disconnected"}</Badge>
                </div>
                <p className="text-meta text-mute">
                  {g.active
                    ? `Connected ${fmt(g.connectedAt)}`
                    : `${REASONS[g.disconnectReason ?? ""] ?? "Disconnected."}${g.disconnectedAt ? ` (${fmt(g.disconnectedAt)})` : ""} Use Connect to add it again.`}
                </p>
              </div>
              {g.active && (
                <Button variant="ghost" size="sm" onClick={() => setToDisconnect(g)} icon={<Unlink className="size-4" aria-hidden />}>
                  Disconnect
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={!!toDisconnect}
        title="Disconnect this group?"
        message={`The bot will leave "${toDisconnect?.title ?? ""}" and it will stop receiving messages.`}
        confirmLabel="Disconnect"
        loading={disconnecting}
        onConfirm={disconnect}
        onCancel={() => setToDisconnect(null)}
      />
    </Card>
  );
}

function StyleCard({ initial, autoApprove }: { initial: string; autoApprove: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [choice, setChoice] = useState(isPresetStyle(initial) ? initial : CUSTOM);
  const [custom, setCustom] = useState(isPresetStyle(initial) ? "" : initial);
  const [saving, setSaving] = useState(false);
  const value = choice === CUSTOM ? custom.trim() : choice;
  const dirty = value !== initial;
  const options = useMemo(() => [...STYLE_PRESETS.map((s) => ({ value: s, label: s })), { value: CUSTOM, label: "Custom…" }], []);

  const save = async () => {
    if (!value) return showToast("Describe your style first.", "error");
    setSaving(true);
    try {
      const res = await fetch("/api/partner/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ style: value }) });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      showToast(res.ok && data.ok ? "Style saved. New previews will use it." : data.error ?? "Could not save.", res.ok && data.ok ? "success" : "error");
      if (res.ok && data.ok) router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoApprove = async () => {
    const enabled = !autoApprove;
    setSaving(true);
    try {
      const res = await fetch("/api/partner/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramAutoApprove: enabled }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      showToast(
        res.ok && data.ok
          ? enabled
            ? "Auto-approval is on for future messages."
            : "Auto-approval is off. You’ll review each message."
          : data.error ?? "Could not update auto-approval.",
        res.ok && data.ok ? "success" : "error"
      );
      if (res.ok && data.ok) router.refresh();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-ink">Message style</h2>
        <p className="text-cell text-mute">Company messages are rewritten in this style before you see them.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
        <Field label="Style">
          <Select value={choice} options={options} onChange={setChoice} />
        </Field>
        {choice === CUSTOM && (
          <Field label="Describe your style" hint={`${custom.length}/${STYLE_MAX}`}>
            <Textarea
              rows={3}
              maxLength={STYLE_MAX}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. Hinglish, friendly, lots of emojis, address members as 'family'"
            />
          </Field>
        )}
      </div>
      <Button onClick={save} loading={saving} disabled={!dirty || !value}>
        Save style
      </Button>
      <SelfPreviewCard style={value} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline p-4">
        <div>
          <p className="font-medium text-ink">Auto-approve future previews</p>
          <p className="text-meta text-mute">
            {autoApprove
              ? "On — future messages in your style will post to connected groups automatically. The admin can see each result in Telegram broadcasts."
              : "Off — review each preview before it posts. Switch on to auto-approve future messages."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={autoApprove}
            aria-label="Auto-approve future Telegram messages"
            disabled={saving}
            onClick={toggleAutoApprove}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
              autoApprove ? "bg-accent" : "bg-mute/40"
            }`}
          >
            <span
              className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                autoApprove ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="min-w-7 text-meta font-medium text-ink" aria-hidden="true">
            {autoApprove ? "On" : "Off"}
          </span>
        </div>
      </div>
    </Card>
  );
}

function SelfPreviewCard({ style }: { style: string }) {
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<{
    input: string;
    style: string;
    text: string;
    unchanged: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const visiblePreview = preview?.input === text && preview.style === style ? preview : null;

  const createPreview = async () => {
    if (!text.trim() || !style) return;
    setLoading(true);
    try {
      const { ok, data } = await post("/api/partner/telegram/preview", { text, style });
      if (!ok) {
        showToast(errorText(data, "Could not create the preview."), "error");
      } else if (typeof data.text !== "string") {
        showToast("The preview response was invalid. Please try again.", "error");
      } else {
        setPreview({ input: text, style, text: data.text, unchanged: data.unchanged === true });
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-hairline p-4">
      <div>
        <h3 className="font-semibold text-ink">Preview your style</h3>
        <p className="text-meta text-mute">Enter your own sample message to see how it reads in the selected style. This won’t be saved or sent.</p>
      </div>
      <Field label="Your sample message" hint={`${text.length}/4000`}>
        <Textarea
          rows={4}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message you might send to your group…"
        />
      </Field>
      <Button
        onClick={createPreview}
        loading={loading}
        disabled={!text.trim() || !style}
        icon={<Sparkles className="size-4" aria-hidden />}
      >
        Generate preview
      </Button>
      {visiblePreview && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-meta font-medium text-ink">Preview · {visiblePreview.style}</p>
          <div className="whitespace-pre-wrap break-words rounded-xl border border-hairline bg-bg p-4 text-cell text-ink">
            {visiblePreview.text}
          </div>
          {visiblePreview.unchanged && <p className="text-meta text-mute">Your message already matches this style.</p>}
        </div>
      )}
    </div>
  );
}

function PendingCard({ d, autoApprove }: { d: DeliveryView; autoApprove: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<"" | "approve" | "regenerate" | "reject">("");

  const act = async (action: "approve" | "regenerate" | "reject", enableAutoApprove = false) => {
    setBusy(action);
    try {
      const { ok, data } = await post(
        `/api/partner/telegram/deliveries/${d._id}/${action}`,
        action === "approve" ? { version: d.version, autoApproveFuture: enableAutoApprove } : undefined
      );
      if (ok) {
        showToast(
          action === "approve"
            ? enableAutoApprove
              ? "Posted. Auto-approval is now on for future previews."
              : "Posted to your group."
            : action === "regenerate"
              ? "New version ready. Review it before approving."
              : "Message rejected.",
          "success"
        );
      } else {
        showToast(errorText(data, "Something went wrong."), "error");
      }
      router.refresh();
    } catch {
      showToast("Network error. You can try again safely.", "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-ink">{d.group}</span>
          <Badge variant={STATUS[d.status].variant}>{STATUS[d.status].label}</Badge>
        </div>
        <span className="text-meta text-mute">
          {fmt(d.createdAt)}
          {d.status === "pending_approval" && d.expiresAt ? ` · ${timeLeft(d.expiresAt)}` : ""}
        </span>
      </div>

      {d.status === "generating" && !d.preview ? (
        <p className="flex items-center gap-2 text-cell text-mute">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Writing a version in your style…
        </p>
      ) : (
        <div className="whitespace-pre-wrap break-words rounded-xl border border-hairline bg-bg p-4 text-cell text-ink">{d.preview}</div>
      )}

      {d.unchanged && d.status === "pending_approval" && (
        <p className="text-meta text-mute">This preview is the same as the original message.</p>
      )}
      {d.error && d.status !== "generating" && (
        <p className="text-meta text-down">
          {d.status === "sending" ? "The last send attempt did not finish. Retrying is safe: it will not post twice." : "Could not create a new version, so the previous one is kept."}
        </p>
      )}
      {!d.groupActive && <p className="text-meta text-down">This group is disconnected. Reconnect it to post this message.</p>}

      <details className="text-meta text-mute">
        <summary className="cursor-pointer select-none">Original message · style: {d.style}</summary>
        <p className="mt-2 whitespace-pre-wrap break-words">{d.original}</p>
      </details>

      {d.status === "pending_approval" && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => act("approve")} loading={busy === "approve"} disabled={!!busy || !d.groupActive} icon={<Check className="size-4" aria-hidden />}>
            Approve &amp; post
          </Button>
          {!autoApprove && (
            <Button
              variant="secondary"
              onClick={() => act("approve", true)}
              loading={busy === "approve"}
              disabled={!!busy || !d.groupActive}
            >
              Approve &amp; auto-approve future
            </Button>
          )}
          <Button variant="secondary" onClick={() => act("regenerate")} loading={busy === "regenerate"} disabled={!!busy} icon={<RefreshCw className="size-4" aria-hidden />}>
            Regenerate
          </Button>
          <Button variant="ghost" onClick={() => act("reject")} loading={busy === "reject"} disabled={!!busy} icon={<X className="size-4" aria-hidden />}>
            Reject
          </Button>
        </div>
      )}
      {d.status === "sending" && (
        <Button variant="secondary" onClick={() => act("approve")} loading={busy === "approve"} disabled={!!busy} icon={<Send className="size-4" aria-hidden />}>
          Retry send
        </Button>
      )}
    </Card>
  );
}

function HistoryCard({ items }: { items: DeliveryView[] }) {
  if (items.length === 0) return null;
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-hairline px-5 py-4">
        <h2 className="font-semibold text-ink">History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-cell">
          <thead className="bg-alt text-meta font-semibold uppercase tracking-wider text-mute">
            <tr>{["Group", "Message", "Status", "Date"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.map((d) => (
              <tr key={d._id} className="align-top">
                <td className="px-4 py-3 font-medium">{d.group}</td>
                <td className="max-w-md px-4 py-3 text-mute">
                  <p className="line-clamp-2 whitespace-pre-wrap break-words">{d.preview ?? d.original}</p>
                  {d.autoApproved && <p className="mt-1 text-meta font-medium text-accent">Auto-approved</p>}
                  {d.status === "failed" && d.error && <p className="mt-1 text-meta text-down">{d.error}</p>}
                </td>
                <td className="px-4 py-3"><Badge variant={STATUS[d.status].variant}>{STATUS[d.status].label}</Badge></td>
                <td className="whitespace-nowrap px-4 py-3 text-mute">{fmt(d.sentAt ?? d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
