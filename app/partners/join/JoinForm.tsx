"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ImagePlus } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/admin/AdminPrimitives";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { slugify } from "@/lib/validation/partner";
import { getReadableTextColor } from "@/lib/theme-utils";

const PRESETS = ["#3b36e0", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#0f172a"];

export function JoinForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");
  const [tagline, setTagline] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b36e0");
  const [hp, setHp] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const onLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError("Logo must be under 2 MB.");
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/partners/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (res.ok && data.ok && data.url) setLogoUrl(data.url);
      else setError(data.error ?? "Logo upload failed.");
    } catch {
      setError("Network error while uploading.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/partners/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, loginId, password, telegramLink, whatsappGroupLink, tagline, mentorBio, logoUrl, primaryColor,
          hp_company: hp,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        router.push("/partner/portal");
        router.refresh();
      } else setError(data.error ?? "Could not sign you up.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const ink = getReadableTextColor(primaryColor);

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link href="/partners" className="text-sm font-semibold text-mute hover:text-ink">← All partners</Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 pb-20 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-5 rounded-3xl border border-hairline bg-card p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Become a partner</h1>
            <p className="mt-1 text-sm text-mute">Get your own landing page and a private portal to track your leads.</p>
          </div>

          <Field label="Your / brand name" required>
            <Input value={name} onChange={(e) => onName(e.target.value)} required maxLength={100} placeholder="Rahul Trading Academy" />
          </Field>

          <Field label="Your page link" required hint={slug ? `Your page: /${slug}` : "Letters, numbers and hyphens"}>
            <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} required maxLength={50} placeholder="rahul-trading" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Login ID" required hint="Used to sign in to your portal">
              <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} required autoComplete="username" maxLength={60} placeholder="you@email.com" />
            </Field>
            <Field label="Password" required hint="At least 8 characters">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </Field>
          </div>

          <Field label="Telegram link" required hint="Where new leads are sent after signing up">
            <Input type="url" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} required placeholder="https://t.me/yourchannel" />
          </Field>
          <Field label="WhatsApp group link">
            <Input type="url" value={whatsappGroupLink} onChange={(e) => setWhatsappGroupLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
          </Field>
          <Field label="Tagline">
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={200} placeholder="Learn price action live, for free" />
          </Field>
          <Field label="About you">
            <Textarea value={mentorBio} onChange={(e) => setMentorBio(e.target.value)} rows={3} maxLength={1000} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Logo" hint="PNG, JPG, WebP or SVG, max 2 MB">
              <label className="flex h-24 cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-hairline-strong bg-bg text-sm text-mute hover:border-accent">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo preview" className="max-h-20 max-w-[80%] object-contain" />
                ) : (
                  <span className="inline-flex items-center gap-2"><ImagePlus className="size-5" aria-hidden />{uploading ? "Uploading…" : "Upload logo"}</span>
                )}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo} className="sr-only" />
              </label>
            </Field>

            <Field label="Brand colour">
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use colour ${c}`}
                    onClick={() => setPrimaryColor(c)}
                    className={`size-8 rounded-full border-2 ${primaryColor === c ? "border-ink" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} aria-label="Custom colour" className="size-8 cursor-pointer rounded-full border border-hairline bg-transparent p-0" />
              </div>
            </Field>
          </div>

          {/* honeypot */}
          <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

          {error && <div role="alert" className="rounded-xl border border-down/30 bg-down/10 p-3 text-sm font-medium text-down">{error}</div>}

          <Button type="submit" disabled={busy || uploading} className="w-full justify-center bg-accent py-3 font-semibold text-accent-ink">
            {busy ? "Creating your page…" : <>Create my page <ArrowRight className="ml-1 inline size-4" aria-hidden /></>}
          </Button>
          <p className="text-center text-sm text-mute">Already a partner? <Link href="/partner/login" className="font-semibold text-accent">Sign in</Link></p>
        </form>

        <aside className="h-fit rounded-3xl border border-hairline bg-card p-6 lg:sticky lg:top-6">
          <p className="text-xs font-bold uppercase tracking-wide text-mute">Preview</p>
          <div className="mt-4 flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-14 rounded-xl border border-hairline bg-bg object-contain p-1" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-xl text-xl font-bold" style={{ backgroundColor: primaryColor, color: ink }}>
                {(name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="font-bold leading-tight">{name || "Your name"}</div>
          </div>
          <p className="mt-3 text-sm text-mute">{tagline || "Your tagline appears here"}</p>
          <div className="mt-5 rounded-xl px-4 py-2.5 text-center text-sm font-bold" style={{ backgroundColor: primaryColor, color: ink }}>Get Free Pass</div>
          <p className="mt-4 text-xs text-mute">Your layout, copy and styling are randomised when you sign up. You can shuffle it any time from your portal.</p>
        </aside>
      </div>
    </main>
  );
}
