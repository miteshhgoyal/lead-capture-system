"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, LogOut, Palette, Users, KeyRound, ExternalLink, Menu } from "lucide-react";
import { ToastProvider } from "@/components/admin/Toast";
import { SiteLogo } from "@/components/ui/SiteLogo";
import { useThemeMode } from "@/components/theme-mode";

const NAV = [
  { href: "/partner/portal", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/partner/portal/leads", label: "My Leads", Icon: Users },
  { href: "/partner/portal/my-page", label: "My Page", Icon: Palette },
  { href: "/partner/portal/account", label: "Account", Icon: KeyRound },
];

interface Props {
  partner: { name: string; slug: string; logoUrl?: string; loginId?: string };
  children: ReactNode;
}

/** Same layout as the admin console: sidebar, top bar with breadcrumb, scrolling content. */
export function PartnerShell({ partner, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, toggle: toggleTheme } = useThemeMode();

  const isCurrent = (href: string) => (href === "/partner/portal" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const current = NAV.find((n) => isCurrent(n.href));

  const logout = async () => {
    try {
      await fetch("/api/partner/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.push("/partner/login");
    router.refresh();
  };

  const nav = (
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      <div>
        <div className="flex h-16 items-center gap-3 border-b border-hairline px-5">
          <Link href="/partner/portal" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center">
            <SiteLogo className="h-9" />
          </Link>
          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Partner</span>
        </div>

        <nav className="space-y-1 p-3">
          {NAV.map(({ href, label, Icon }) => {
            const active = isCurrent(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-cell font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-accent to-accent-2 font-semibold text-accent-ink shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--accent)_50%,transparent)]"
                    : "text-mute hover:bg-bg-alt hover:text-ink"
                }`}
              >
                <Icon className="size-4.5 shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 border-t border-hairline p-4">
        <div className="flex items-center gap-3 px-2">
          {partner.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logoUrl} alt="" className="size-8 rounded-full border border-hairline bg-bg object-contain p-0.5" />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full border border-accent/25 bg-accent/15 text-xs font-bold text-accent">
              {partner.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-meta font-medium text-ink">{partner.name}</span>
            <span className="block truncate text-[11px] text-faint">{partner.loginId || "Partner"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-cell font-medium text-down transition-colors hover:bg-down/10"
        >
          <LogOut className="size-4.5" aria-hidden />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="flex h-dvh overflow-hidden bg-bg font-sans text-ink antialiased">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-card lg:flex">{nav}</aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 animate-[f-fadein_.2s_ease-out] bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 max-w-[85vw] animate-[f-modalin_.25s_var(--ease)] border-r border-hairline bg-card shadow-2xl">{nav}</div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-hairline bg-card px-4 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="shrink-0 rounded-lg p-2 text-mute hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-5" aria-hidden />
              </button>
              <div className="flex min-w-0 items-center gap-2 text-cell font-medium">
                <span className="text-mute">Partner</span>
                <span className="text-faint">/</span>
                <span className="truncate font-semibold text-ink">{current?.label ?? "Overview"}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href={`/${partner.slug}`}
                target="_blank"
                className="hidden items-center gap-1.5 rounded-xl border border-hairline px-3 py-1.5 text-xs font-semibold text-mute transition hover:bg-bg-alt hover:text-ink sm:inline-flex"
              >
                <span>My Public Page</span>
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl p-2 text-mute transition hover:bg-hairline hover:text-ink"
                aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
              >
                {mode === "dark" ? (
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                )}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-bg p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
