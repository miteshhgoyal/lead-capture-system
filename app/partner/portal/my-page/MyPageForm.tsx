"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";

const PRESETS = ["#3b36e0", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#0f172a"];

interface Initial {
  name: string;
  telegramLink: string;
  whatsappGroupLink: string;
  tagline: string;
  mentorBio: string;
  logoUrl: string;
  primaryColor: string;
}

export function MyPageForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Initial>(k: K, v: Initial[K]) => setF((p) => ({ ...p, [k]: v }));

  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return showToast("Logo must be under 2 MB.", "error");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/partners/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (res.ok && data.ok && data.url) set("logoUrl", data.url);
      else showToast(data.error ?? "Logo upload failed.", "error");
    } catch {
      showToast("Network error while uploading.", "error");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/partner/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        showToast("Saved. Your public page is updated.", "success");
        router.refresh();
      } else showToast(data.error ?? "Could not save.", "error");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <Card className="space-y-4">
        <Field label="Name" required><Input value={f.name} onChange={(e) => set("name", e.target.value)} required maxLength={100} /></Field>
        <Field label="Tagline"><Input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={200} /></Field>
        <Field label="About you"><Textarea value={f.mentorBio} onChange={(e) => set("mentorBio", e.target.value)} rows={4} maxLength={1000} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telegram link" required><Input type="url" value={f.telegramLink} onChange={(e) => set("telegramLink", e.target.value)} required /></Field>
          <Field label="WhatsApp group link"><Input type="url" value={f.whatsappGroupLink} onChange={(e) => set("whatsappGroupLink", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo" hint="PNG, JPG, WebP or SVG, max 2 MB">
            <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-hairline-strong bg-bg text-sm text-mute hover:border-accent">
              {f.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.logoUrl} alt="Logo" className="max-h-16 max-w-[80%] object-contain" />
              ) : uploading ? "Uploading…" : "Upload logo"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo} className="sr-only" />
            </label>
          </Field>
          <Field label="Brand colour">
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button key={c} type="button" aria-label={`Use colour ${c}`} onClick={() => set("primaryColor", c)} className={`size-8 rounded-full border-2 ${f.primaryColor === c ? "border-ink" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={f.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} aria-label="Custom colour" className="size-8 cursor-pointer rounded-full border border-hairline bg-transparent p-0" />
            </div>
          </Field>
        </div>
        <div className="flex justify-end border-t border-hairline pt-4">
          <Button type="submit" disabled={saving || uploading} className="bg-accent font-semibold text-accent-ink">{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </Card>
    </form>
  );
}
