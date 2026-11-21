"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Loader2 } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/admin/AdminPrimitives";
import { slugify } from "@/lib/validation/partner";
import { getReadableTextColor } from "@/lib/theme-utils";

const PRESETS = ["#3b36e0", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#0f172a"];

type SlugState = "idle" | "checking" | "ok" | "taken";

/**
 * Two-step partner sign-up: 1) who you are and how you sign in, 2) how your page looks.
 * Used in the hero of `/` and on /partner/join. On success the partner is signed in and sent to the portal.
 */
export function PartnerSignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [name, setName] = useState("");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");

  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<SlugState>("idle");
  const [slugReason, setSlugReason] = useState("");
  const [tagline, setTagline] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b36e0");

  const [hp, setHp] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Live availability check for the page link
  useEffect(() => {
    if (slug.length < 2) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/partners/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = (await res.json()) as { available?: boolean; reason?: string };
        setSlugState(data.available ? "ok" : "taken");
        setSlugReason(data.reason ?? "");
      } catch {
        setSlugState("idle");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [slug]);

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const next = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setStep(2);
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
    if (slugState === "taken") return setError(slugReason || "That link is taken. Pick another.");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/partners/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, loginId, password, telegramLink, whatsappGroupLink, tagline, mentorBio, logoUrl, primaryColor, hp_company: hp }),
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
    <div id="lead-form" className="scroll-mt-24 rounded-3xl border border-hairline bg-card p-6 shadow-xl sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-ink">Become a partner</h2>
          <p className="mt-1 text-sm text-mute">Free. Your page goes live the moment you finish.</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">Step {step} of 2</span>
      </div>

      <div className="mb-5 flex gap-2" aria-hidden>
        <span className="h-1.5 flex-1 rounded-full bg-accent" />
        <span className={`h-1.5 flex-1 rounded-full ${step === 2 ? "bg-accent" : "bg-hairline"}`} />
      </div>

      {step === 1 ? (
        <form onSubmit={next} className="space-y-4">
          <Field label="Your / brand name" required>
            <Input value={name} onChange={(e) => onName(e.target.value)} required maxLength={100} placeholder="Rahul Trading Academy" autoComplete="organization" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Login ID" required>
              <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} required minLength={3} maxLength={60} autoComplete="username" placeholder="you@email.com" />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="8+ characters" />
            </Field>
          </div>
          <Field label="Telegram link" required hint="Shown to your leads after they sign up">
            <Input type="url" value={telegramLink} onChange={(e) => setTelegramLink(e.target.value)} required placeholder="https://t.me/yourchannel" />
          </Field>
          <Field label="WhatsApp group link">
            <Input type="url" value={whatsappGroupLink} onChange={(e) => setWhatsappGroupLink(e.target.value)} placeholder="https://chat.whatsapp.com/…" />
          </Field>
          {error && <div role="alert" className="rounded-xl border border-down/30 bg-down/10 p-3 text-sm font-medium text-down">{error}</div>}
          <Button type="submit" className="w-full justify-center bg-accent py-3 font-semibold text-accent-ink">
            Continue <ArrowRight className="ml-1 inline size-4" aria-hidden />
          </Button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Your page link"
            required
            error={slugState === "taken" ? slugReason || "That link is taken." : undefined}
            hint={slugState === "ok" ? `Available: /${slug}` : slugState === "checking" ? "Checking…" : "Letters, numbers and hyphens"}
          >
            <Input value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} required maxLength={50} placeholder="rahul-trading" />
          </Field>
          <Field label="Tagline"><Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={200} placeholder="Learn price action live, for free" /></Field>
          <Field label="About you"><Textarea value={mentorBio} onChange={(e) => setMentorBio(e.target.value)} rows={2} maxLength={1000} /></Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Logo" hint="PNG, JPG, WebP, SVG · 2 MB">
              <label className="flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-hairline-strong bg-bg text-sm text-mute hover:border-accent">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo preview" className="max-h-16 max-w-[80%] object-contain" />
                ) : uploading ? (
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                ) : (
                  <span className="inline-flex items-center gap-2"><ImagePlus className="size-5" aria-hidden /> Upload logo</span>
                )}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo} className="sr-only" />
              </label>
            </Field>
            <Field label="Brand colour">
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((c) => (
                  <button key={c} type="button" aria-label={`Use colour ${c}`} onClick={() => setPrimaryColor(c)} className={`size-7 rounded-full border-2 ${primaryColor === c ? "border-ink" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} aria-label="Custom colour" className="size-7 cursor-pointer rounded-full border border-hairline bg-transparent p-0" />
              </div>
            </Field>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-bg p-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="size-10 rounded-lg border border-hairline bg-card object-contain p-0.5" />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-lg text-base font-bold" style={{ backgroundColor: primaryColor, color: ink }}>{(name || "?").slice(0, 1).toUpperCase()}</div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{name || "Your name"}</div>
              <div className="truncate text-xs text-mute">{tagline || "Your tagline"}</div>
            </div>
            <span className="rounded-lg px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: primaryColor, color: ink }}>Get Free Pass</span>
          </div>

          <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

          {error && <div role="alert" className="rounded-xl border border-down/30 bg-down/10 p-3 text-sm font-medium text-down">{error}</div>}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setError(""); setStep(1); }} className="justify-center">
              <ArrowLeft className="mr-1 inline size-4" aria-hidden /> Back
            </Button>
            <Button type="submit" disabled={busy || uploading || slugState === "taken"} className="flex-1 justify-center bg-accent py-3 font-semibold text-accent-ink">
              {busy ? "Creating your page…" : <><Check className="mr-1 inline size-4" aria-hidden /> Create my page</>}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-mute">
        Already a partner? <Link href="/partner/login" className="font-semibold text-accent">Sign in</Link>
      </p>
    </div>
  );
}
