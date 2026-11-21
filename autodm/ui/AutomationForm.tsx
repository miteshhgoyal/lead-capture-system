"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button, Card, Field, Input, Switch, Textarea } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";
import { api } from "./api";
import { TRIGGER_LABEL } from "./AutomationsList";

interface Account { id: string; platform: string; username: string; status: string }
interface Features { triggers: { comment: boolean; story: boolean; dm_keyword: boolean }; publicReply: boolean }
interface Media { id: string; caption?: string; thumbnailUrl?: string; permalink?: string; timestamp?: string }
interface Form {
  accountId: string; name: string; triggerType: string; mediaId: string | null; mediaPermalink: string; mediaThumbnail: string;
  keywordList: string[]; matchType: string; caseSensitive: boolean; dmMessage: string; dmButtons: { label: string; url: string }[];
  commentReplyVariants: string[]; sendOncePerUser: boolean; captureEmail: boolean; startsAt: string; endsAt: string;
}
const EMPTY: Form = { accountId: "", name: "", triggerType: "comment", mediaId: null, mediaPermalink: "", mediaThumbnail: "", keywordList: [], matchType: "contains", caseSensitive: false, dmMessage: "", dmButtons: [], commentReplyVariants: [], sendOncePerUser: true, captureEmail: false, startsAt: "", endsAt: "" };
const STEPS = ["Account", "Trigger", "Post", "Keywords", "Message", "Review"];
const selectCls = "w-full rounded-xl border border-hairline-strong bg-bg px-3 py-2.5 text-cell text-ink";
const localInput = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function AutomationForm({ automationId }: { automationId?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [features, setFeatures] = useState<Features | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaNext, setMediaNext] = useState<string | null>(null);
  const [mediaErr, setMediaErr] = useState("");
  const [kw, setKw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<string | undefined>(automationId);
  const [checks, setChecks] = useState<{ ok: boolean; text: string }[] | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    void (async () => {
      const [a, f] = await Promise.all([api<{ accounts: Account[] }>("accounts"), api<{ features: Features }>("features")]);
      setAccounts((a.data.accounts ?? []).filter((x) => x.status === "active"));
      setFeatures(f.data.features ?? null);
      if (automationId) {
        const r = await api<{ automation: Form & { startsAt: string | null; endsAt: string | null; mediaId: string | null } }>(`automations/${automationId}`);
        if (r.ok) {
          const x = r.data.automation;
          setForm({ ...EMPTY, ...x, mediaPermalink: x.mediaPermalink ?? "", mediaThumbnail: x.mediaThumbnail ?? "", startsAt: localInput(x.startsAt), endsAt: localInput(x.endsAt) });
        } else setError(r.data.error ?? "Could not load the automation");
      } else if ((a.data.accounts ?? []).length === 1) setForm((s) => ({ ...s, accountId: a.data.accounts![0].id }));
    })();
  }, [automationId]);

  const loadMedia = async (after?: string) => {
    setMediaErr("");
    const r = await api<{ items: Media[]; next: string | null }>(`media?accountId=${form.accountId}${after ? `&after=${encodeURIComponent(after)}` : ""}`);
    if (!r.ok) return setMediaErr(r.data.error ?? "Could not load posts");
    setMedia((m) => (after ? [...m, ...(r.data.items ?? [])] : r.data.items ?? []));
    setMediaNext(r.data.next ?? null);
  };
  useEffect(() => { if (step === 2 && form.triggerType === "comment" && form.accountId && media.length === 0) void loadMedia(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [step]);

  const flagOn = (t: string) => !features ? true : t === "comment" ? features.triggers.comment : t.startsWith("story") ? features.triggers.story : features.triggers.dm_keyword;
  const needsKeywords = form.triggerType === "comment" || form.triggerType === "dm_keyword";
  const visible = useMemo(() => STEPS.map((s, i) => ({ s, i })).filter(({ i }) => !(i === 2 && form.triggerType !== "comment") && !(i === 3 && !needsKeywords)), [form.triggerType, needsKeywords]);
  const pos = visible.findIndex((v) => v.i === step);
  const go = (d: 1 | -1) => setStep(visible[Math.min(visible.length - 1, Math.max(0, pos + d))].i);

  const addKw = () => { const items = kw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean); if (items.length) set("keywordList", [...new Set([...form.keywordList, ...items])].slice(0, 20)); setKw(""); };
  const payload = () => ({ ...form, mediaId: form.triggerType === "comment" ? form.mediaId : null, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null });

  const save = async (): Promise<string | null> => {
    setSaving(true); setError("");
    const r = await api<{ automation: { id: string } }>(savedId ? `automations/${savedId}` : "automations", { method: savedId ? "PUT" : "POST", body: payload() });
    setSaving(false);
    if (!r.ok) { setError(r.data.error ?? "Could not save"); return null; }
    setSavedId(r.data.automation.id);
    return r.data.automation.id;
  };
  const saveDraft = async () => { const id = await save(); if (id) { showToast("Saved"); router.push("/autodm/automations"); } };
  const test = async () => { const id = await save(); if (!id) return; const r = await api<{ checks: { ok: boolean; text: string }[] }>(`automations/${id}/test`, { method: "POST", body: {} }); setChecks(r.data.checks ?? null); if (!r.ok) setError(r.data.error ?? "Test failed"); };
  const activate = async () => { const id = await save(); if (!id) return; const r = await api(`automations/${id}/activate`, { method: "POST" }); if (!r.ok) return setError(r.data.error ?? "Could not activate"); showToast("Automation is live"); router.push("/autodm/automations"); };

  const preview = form.dmMessage.replace(/\{\{\s*username\s*\}\}/gi, "@username").replace(/\{\{\s*first_?name\s*\}\}/gi, "there");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {visible.map(({ s, i }, n) => (
          <li key={s} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${i === step ? "border-accent bg-accent/10 font-semibold text-accent" : n < pos ? "border-hairline text-mute" : "border-hairline text-faint"}`}>{n < pos ? <Check className="size-3" aria-hidden /> : null}{n + 1}. {s}</li>
        ))}
      </ol>

      <Card className="space-y-5 p-5">
        {step === 0 && (<>
          <Field label="Automation name" required><Input value={form.name} maxLength={80} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Free guide – comment GUIDE" /></Field>
          <Field label="Account" required hint={accounts.length === 0 ? "No connected account" : undefined}>
            <select className={selectCls} value={form.accountId} disabled={Boolean(automationId)} onChange={(e) => set("accountId", e.target.value)}>
              <option value="">Select an account…</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>@{a.username} ({a.platform})</option>)}
            </select>
          </Field>
        </>)}

        {step === 1 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">What should start this automation?</div>
            {Object.entries(TRIGGER_LABEL).map(([k, label]) => (
              <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${form.triggerType === k ? "border-accent bg-accent/5" : "border-hairline"} ${flagOn(k) ? "" : "opacity-50"}`}>
                <input type="radio" name="trigger" className="mt-1" checked={form.triggerType === k} disabled={!flagOn(k)} onChange={() => { set("triggerType", k); if (k === "dm_default" || k === "story_mention") set("matchType", "any"); }} />
                <span><span className="font-medium">{label}</span>{!flagOn(k) && <span className="ml-2 text-xs text-down">Disabled by the administrator</span>}
                  <span className="block text-xs text-mute">{k === "comment" ? "Sends a private reply (one per comment, within 7 days)." : k === "dm_default" ? "Replies to a DM that matches no keyword, within 24 hours." : k === "story_mention" ? "Replies when someone mentions you in their story, within 24 hours." : "Replies within 24 hours of their message."}</span></span>
              </label>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="text-sm font-semibold">Which post or reel?</div>
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={!form.mediaId} onChange={() => { set("mediaId", null); set("mediaPermalink", ""); set("mediaThumbnail", ""); }} /> All posts and reels</label>
            {mediaErr && <div className="text-xs text-down">{mediaErr}</div>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {media.map((m) => (
                <button key={m.id} type="button" onClick={() => { set("mediaId", m.id); set("mediaPermalink", m.permalink ?? ""); set("mediaThumbnail", m.thumbnailUrl ?? ""); }} className={`overflow-hidden rounded-xl border text-left text-xs ${form.mediaId === m.id ? "border-accent ring-2 ring-accent/30" : "border-hairline"}`}>
                  {m.thumbnailUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.thumbnailUrl} alt="" className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-alt text-faint">No preview</div>}
                  <div className="line-clamp-2 p-2 text-mute">{m.caption || "(no caption)"}</div>
                </button>
              ))}
            </div>
            {mediaNext && <Button size="sm" variant="secondary" type="button" onClick={() => loadMedia(mediaNext)}>Load more</Button>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Match type">
              <select className={selectCls} value={form.matchType} onChange={(e) => set("matchType", e.target.value)}>
                <option value="contains">Message contains a keyword</option><option value="exact">Message is exactly a keyword</option><option value="any">Any message</option>
              </select>
            </Field>
            {form.matchType !== "any" && (
              <Field label="Keywords" hint="Press Enter or comma to add. Up to 20.">
                <div className="flex gap-2"><Input value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKw(); } }} placeholder="GUIDE" /><Button type="button" variant="secondary" onClick={addKw} icon={<Plus className="size-4" aria-hidden />}>Add</Button></div>
                <div className="mt-2 flex flex-wrap gap-2">{form.keywordList.map((k) => <span key={k} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{k}<button type="button" aria-label={`Remove ${k}`} onClick={() => set("keywordList", form.keywordList.filter((x) => x !== k))}><X className="size-3" aria-hidden /></button></span>)}</div>
              </Field>
            )}
            <Switch checked={form.caseSensitive} onChange={(v) => set("caseSensitive", v)} label="Case sensitive" />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Field label="Direct message" required hint={`${form.dmMessage.length}/${form.dmButtons.length ? 600 : 900}`}>
              <Textarea rows={5} value={form.dmMessage} onChange={(e) => set("dmMessage", e.target.value)} placeholder="Hey {{username}}! Here's the link you asked for 👇" />
              <div className="mt-1 text-[11px] text-faint">Variables: {"{{username}}"} (only when Instagram provides it; otherwise “there”).</div>
            </Field>
            <div className="space-y-2">
              <div className="text-sm font-semibold">Buttons (max 3, https links only)</div>
              {form.dmButtons.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={b.label} maxLength={20} placeholder="Label" onChange={(e) => set("dmButtons", form.dmButtons.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <Input value={b.url} placeholder="https://…" onChange={(e) => set("dmButtons", form.dmButtons.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                  <button type="button" aria-label="Remove button" onClick={() => set("dmButtons", form.dmButtons.filter((_, j) => j !== i))} className="rounded-lg p-2 text-down hover:bg-down/10"><X className="size-4" aria-hidden /></button>
                </div>
              ))}
              {form.dmButtons.length < 3 && <Button size="sm" variant="secondary" type="button" onClick={() => set("dmButtons", [...form.dmButtons, { label: "", url: "" }])} icon={<Plus className="size-4" aria-hidden />}>Add button</Button>}
            </div>
            {form.triggerType === "comment" && features?.publicReply && (
              <Field label="Public reply under the comment (optional)" hint="One random variant per comment, max 5">
                <Textarea rows={3} value={form.commentReplyVariants.join("\n")} onChange={(e) => set("commentReplyVariants", e.target.value.split("\n").slice(0, 5))} placeholder={"Check your DMs! 📩\nSent you a message 🙌"} />
              </Field>
            )}
            <Switch checked={form.captureEmail} onChange={(v) => set("captureEmail", v)} label="Ask for an email address" description="Adds a line asking them to reply with their email. Their next message is validated and saved to the lead." />
            <Switch checked={form.sendOncePerUser} onChange={(v) => set("sendOncePerUser", v)} label="Send only once per person" description="Recommended. Prevents repeat DMs to the same person for this automation." />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start (optional)"><input type="datetime-local" className={selectCls} value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} /></Field>
              <Field label="End (optional)"><input type="datetime-local" className={selectCls} value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} /></Field>
            </div>
            <div className="rounded-2xl bg-alt p-4"><div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">Preview</div>
              <div className="max-w-xs whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-card p-3 text-sm shadow-sm">{preview || "Your message appears here"}{form.captureEmail ? "\n\nReply to this message with your email address and we'll send it over." : ""}</div>
              {form.dmButtons.filter((b) => b.label).map((b, i) => <div key={i} className="mt-1 max-w-xs rounded-xl bg-card p-2 text-center text-sm font-semibold text-accent shadow-sm">{b.label}</div>)}</div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <div><span className="text-mute">Name:</span> {form.name}</div><div><span className="text-mute">Trigger:</span> {TRIGGER_LABEL[form.triggerType]}</div>
              <div><span className="text-mute">Scope:</span> {form.triggerType === "comment" ? (form.mediaId ? "One post/reel" : "All posts") : "—"}</div>
              <div><span className="text-mute">Keywords:</span> {form.matchType === "any" ? "Any message" : form.keywordList.join(", ") || "—"}</div>
            </div>
            <div className="rounded-xl bg-alt p-3 text-xs text-mute">Rules enforced automatically: replies only go to people who interacted first; one private reply per comment within 7 days; DM replies within 24 hours of the person&apos;s last message; once per person unless you turn that off.</div>
            {checks && <ul className="space-y-1">{checks.map((c, i) => <li key={i} className={c.ok ? "text-up" : "text-down"}>{c.ok ? "✓" : "✗"} {c.text}</li>)}</ul>}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={test} loading={saving}>Save &amp; check</Button>
              <Button type="button" variant="secondary" onClick={saveDraft} loading={saving}>Save as draft</Button>
              <Button type="button" onClick={activate} loading={saving}>Save &amp; activate</Button>
            </div>
          </div>
        )}

        {error && <div role="alert" className="rounded-xl border border-down/30 bg-down/10 p-3 text-sm text-down">{error}</div>}
        <div className="flex justify-between border-t border-hairline pt-4">
          <Button type="button" variant="ghost" onClick={() => (pos === 0 ? router.push("/autodm/automations") : go(-1))} icon={<ChevronLeft className="size-4" aria-hidden />}>{pos === 0 ? "Cancel" : "Back"}</Button>
          {pos < visible.length - 1 && <Button type="button" disabled={(step === 0 && (!form.name.trim() || !form.accountId)) || (step === 1 && !flagOn(form.triggerType)) || (step === 4 && !form.dmMessage.trim())} onClick={() => go(1)}>Next <ChevronRight className="ml-1 inline size-4" aria-hidden /></Button>}
        </div>
      </Card>
    </div>
  );
}
