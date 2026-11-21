import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/ui/SiteLogo";

/** Plain, readable shell for the public legal pages (privacy, terms, data deletion, contact). */
export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg font-sans text-ink">
      <header className="border-b border-hairline bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label="Home"><SiteLogo className="h-8" /></Link>
          <nav className="flex gap-4 text-sm text-mute">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/data-deletion" className="hover:text-ink">Data deletion</Link>
            <Link href="/contact" className="hover:text-ink">Contact</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-5 py-10 text-[15px] leading-7 text-ink/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_a]:text-accent [&_a]:underline">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {updated && <p className="text-sm text-mute">Last updated: {updated}</p>}
        {children}
      </main>
    </div>
  );
}
