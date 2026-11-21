"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Field, Input } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";

export function PasswordForm() {
  const { showToast } = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/partner/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        showToast("Password changed.", "success");
        setCurrent("");
        setNew("");
      } else showToast(data.error ?? "Could not change password.", "error");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Card className="space-y-4">
        <h2 className="font-semibold text-ink">Change password</h2>
        <Field label="Current password" required><Input type="password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" /></Field>
        <Field label="New password" required hint="At least 8 characters"><Input type="password" value={newPassword} onChange={(e) => setNew(e.target.value)} required minLength={8} autoComplete="new-password" /></Field>
        <Button type="submit" disabled={busy} className="bg-accent font-semibold text-accent-ink">{busy ? "Updating…" : "Update password"}</Button>
      </Card>
    </form>
  );
}
