"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Shuffle } from "lucide-react";
import { Button, Card } from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";

/** Public link of the partner with copy / open / shuffle-layout actions. */
export function ShareLinkCard({ slug }: { slug: string }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const path = `/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Could not copy. Copy the link manually.", "error");
    }
  };

  const shuffle = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/partner/shuffle", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      showToast(res.ok && data.ok ? "Your page has a brand new layout." : data.error ?? "Could not shuffle.", res.ok && data.ok ? "success" : "error");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="min-w-0">
        <p className="text-label font-semibold uppercase tracking-wider text-mute">Your public link</p>
        <p className="mt-1 truncate font-mono text-cell text-ink">{path}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={copy}>
          {copied ? <Check className="mr-1 inline size-4" aria-hidden /> : <Copy className="mr-1 inline size-4" aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <a href={path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-hairline-strong px-4 text-cell font-semibold text-ink transition hover:bg-bg-alt">
          <ExternalLink className="size-4" aria-hidden /> Open
        </a>
        <Button variant="secondary" onClick={shuffle} disabled={busy}>
          <Shuffle className="mr-1 inline size-4" aria-hidden /> {busy ? "Shuffling…" : "Shuffle layout"}
        </Button>
      </div>
    </Card>
  );
}
