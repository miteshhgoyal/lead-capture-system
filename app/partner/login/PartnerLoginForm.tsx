"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Field, Input } from "@/components/admin/AdminPrimitives";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

export function PartnerLoginForm() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/partner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: loginId.trim(), password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        router.push("/partner/portal");
        router.refresh();
      } else setError(data.error ?? "Invalid login ID or password.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm rounded-3xl border border-hairline bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-ink">Partner Portal</h1>
          <p className="mt-1 text-sm text-mute">Sign in to see your leads and manage your page</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Login ID" required>
            <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} required autoComplete="username" />
          </Field>
          <Field label="Password" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          {error && <div role="alert" className="rounded-xl border border-down/30 bg-down/10 p-3 text-sm font-medium text-down">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full justify-center bg-accent py-3 font-semibold text-accent-ink">
            {busy ? "Signing in…" : <>Sign in <ArrowRight className="ml-1 inline size-4" aria-hidden /></>}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-mute">New here? <Link href="/partners/join" className="font-semibold text-accent">Become a partner</Link></p>
      </div>
    </div>
  );
}
