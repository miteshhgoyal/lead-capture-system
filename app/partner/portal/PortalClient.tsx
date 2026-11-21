"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, LogOut, Shuffle } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/admin/AdminPrimitives";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

export interface PortalLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  status: string;
  createdAt: string;
}

interface Props {
  partner: {
    name: string;
    slug: string;
    loginId: string;
    telegramLink: string;
    whatsappGroupLink: string;
    tagline: string;
    mentorBio: string;
    logoUrl: string;
    primaryColor: string;
  };
  stats: { total: number; today: number; week: number; byStatus: Record<string, number> };
  leads: PortalLead[];
  truncated: boolean;
}

const PRESETS = ["#3b36e0", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#0f172a"];
const STATUS_LABEL: Record<string, string> = { new: "New", contacted: "Contacted", joined: "Joined", "not-interested": "Not interested" };

async function api(url: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export function PortalClient({ partner, stats, leads, truncated }: Props) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState(partner.name);
  const [telegramLink, setTelegramLink] = useState(partner.telegramLink);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState(partner.whatsappGroupLink);
  const [tagline, setTagline] = useState(partner.tagline);
  const [mentorBio, setMentorBio] = useState(partner.mentorBio);
  const [logoUrl, setLogoUrl] = useState(partner.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(partner.primaryColor);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const pageUrl = `/${partner.slug}`;
  const say = (ok: boolean, text: string) => setMsg({ type: ok ? "ok" : "err", text });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${pageUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      say(false, "Could not copy. Copy the link manually.");
    }
  };

  const logout = async () => {
    await api("/api/partner/logout", "POST");
    router.push("/partner/login");
    router.refresh();
  };

  const shuffle = async () => {
    setBusy("shuffle");
    const r = await api("/api/partner/shuffle", "POST");
    say(r.ok, r.ok ? "Done. Your page has a brand new layout." : r.error ?? "Could not shuffle.");
    setBusy("");
  };

  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return say(false, "Logo must be under 2 MB.");
    setBusy("logo");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/partners/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (res.ok && data.ok && data.url) setLogoUrl(data.url);
      else say(false, data.error ?? "Logo upload failed.");
    } catch {
      say(false, "Network error while uploading.");
    }
    setBusy("");
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("save");
    const r = await api("/api/partner/me", "PATCH", { name, telegramLink, whatsappGroupLink, tagline, mentorBio, logoUrl, primaryColor });
    say(r.ok, r.ok ? "Saved. Your public page is updated." : r.error ?? "Could not save.");
    if (r.ok) router.refresh();
    setBusy("");
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("pw");
    const r = await api("/api/partner/me", "PATCH", { currentPassword, newPassword });
    say(r.ok, r.ok ? "Password changed." : r.error ?? "Could not change password.");
    if (r.ok) {
      setCurrentPassword("");
      setNewPassword("");
    }
    setBusy("");
  };

  const tiles: [string, number][] = [
    ["Total leads", stats.total],
    ["Today", stats.today],
    ["Last 7 days", stats.week],
    ["Joined", stats.byStatus.joined ?? 0],
  ];

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{partner.name}</h1>
          <p className="text-sm text-mute">Partner portal{partner.loginId ? ` · ${partner.loginId}` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="secondary" onClick={logout}><LogOut className="mr-1 inline size-4" aria-hidden /> Sign out</Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-20">
        {msg && (
          <div role="status" className={`rounded-xl border p-3 text-sm font-medium ${msg.type === "ok" ? "border-up/30 bg-up/10 text-up" : "border-down/30 bg-down/10 text-down"}`}>
            {msg.text}
          </div>
        )}

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-card p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-mute">Your public link</p>
            <p className="truncate font-mono text-sm">{pageUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={copy}>{copied ? <Check className="mr-1 inline size-4" aria-hidden /> : <Copy className="mr-1 inline size-4" aria-hidden />}{copied ? "Copied" : "Copy full link"}</Button>
            <a href={pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3.5 py-2 text-sm font-semibold hover:bg-bg"><ExternalLink className="size-4" aria-hidden /> Open</a>
            <Button variant="secondary" onClick={shuffle} disabled={busy === "shuffle"}><Shuffle className="mr-1 inline size-4" aria-hidden /> {busy === "shuffle" ? "Shuffling…" : "Shuffle layout"}</Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map(([label, n]) => (
            <div key={label} className="rounded-2xl border border-hairline bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-mute">{label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{n.toLocaleString()}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-hairline bg-card">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <h2 className="font-bold">Leads from your link</h2>
            <span className="text-xs text-mute">Email and phone are masked</span>
          </div>
          {leads.length === 0 ? (
            <p className="p-10 text-center text-mute">No leads yet. Share your link to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-mute">
                  <tr>{["Name", "Phone", "Email", "Country", "Status", "Date"].map((h) => <th key={h} className="px-5 py-3 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t border-hairline">
                      <td className="px-5 py-3 font-medium">{l.name}</td>
                      <td className="px-5 py-3 font-mono text-xs">{l.phone}</td>
                      <td className="px-5 py-3 font-mono text-xs">{l.email}</td>
                      <td className="px-5 py-3">{l.country}</td>
                      <td className="px-5 py-3">{STATUS_LABEL[l.status] ?? l.status}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-mute">{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {truncated && <p className="border-t border-hairline px-5 py-3 text-xs text-mute">Showing your latest {leads.length} leads. The count above includes all of them.</p>}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-hairline bg-card p-5">
            <h2 className="font-bold">Your page</h2>
            <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} /></Field>
            <Field label="Tagline"><Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={200} /></Field>
            <Field label="About you"><Textarea value={mentorBio} onChange={(e) => setMentorBio(e.target.value)} rows={3} maxLength={1000} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telegram link" required><Input type="url" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} required /></Field>
              <Field label="WhatsApp group link"><Input type="url" value={whatsappGroupLink} onChange={(e) => setWhatsappGroupLink(e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo" hint="PNG, JPG, WebP or SVG, max 2 MB">
                <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-hairline-strong bg-bg text-sm text-mute hover:border-accent">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="max-h-16 max-w-[80%] object-contain" />
                  ) : busy === "logo" ? "Uploading…" : "Upload logo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo} className="sr-only" />
                </label>
              </Field>
              <Field label="Brand colour">
                <div className="flex flex-wrap items-center gap-2">
                  {PRESETS.map((c) => (
                    <button key={c} type="button" aria-label={`Use colour ${c}`} onClick={() => setPrimaryColor(c)} className={`size-8 rounded-full border-2 ${primaryColor === c ? "border-ink" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} aria-label="Custom colour" className="size-8 cursor-pointer rounded-full border border-hairline bg-transparent p-0" />
                </div>
              </Field>
            </div>
            <Button type="submit" disabled={busy === "save" || busy === "logo"} className="bg-accent font-semibold text-accent-ink">{busy === "save" ? "Saving…" : "Save changes"}</Button>
          </form>

          <form onSubmit={savePassword} className="h-fit space-y-4 rounded-2xl border border-hairline bg-card p-5">
            <h2 className="font-bold">Change password</h2>
            <Field label="Current password" required><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" /></Field>
            <Field label="New password" required hint="At least 8 characters"><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></Field>
            <Button type="submit" variant="secondary" disabled={busy === "pw"}>{busy === "pw" ? "Updating…" : "Update password"}</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
