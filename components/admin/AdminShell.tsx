"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ToastProvider } from "./Toast";
import { SiteLogo } from "@/components/ui/SiteLogo";
import { useThemeMode } from "@/components/theme-mode";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" />
        <rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" />
        <rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/partners",
    label: "Partners",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/admin/autodm",
    label: "AutoDM",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/admin/telegram",
    label: "Telegram",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, toggle: toggleTheme } = useThemeMode();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    router.push("/admin/login");
    router.refresh();
  };

  const isCurrent = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const currentItem = navItems.find((item) => isCurrent(item.href));
  const pageTitle = title ?? currentItem?.label ?? "Overview";

  const navContent = (
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      <div>
        <div className="flex h-16 items-center gap-3 border-b border-hairline px-5">
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center">
            <SiteLogo className="h-9" />
          </Link>
          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">Admin</span>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = isCurrent(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-cell font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-accent to-accent-2 text-accent-ink shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--accent)_50%,transparent)] font-semibold"
                    : "text-mute hover:bg-bg-alt hover:text-ink"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-hairline space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xs font-bold">
            AD
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-meta font-medium text-ink truncate">Admin Console</span>
            <span className="block text-[11px] text-faint">System Administrator</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-cell font-medium text-down hover:bg-down/10 transition-colors"
        >
          <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      {/* h-dvh (not h-screen) so the bottom of the layout is not hidden behind mobile browser bars */}
      <div className="flex h-dvh bg-bg text-ink antialiased overflow-hidden font-sans">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-hairline bg-card shrink-0">
          {navContent}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-[f-fadein_.2s_ease-out]"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-card border-r border-hairline shadow-2xl animate-[f-modalin_.25s_var(--ease)]">
              {navContent}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between gap-2 border-b border-hairline bg-card px-4 lg:px-8 shrink-0">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden shrink-0 p-2 text-mute hover:text-ink rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Open sidebar"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              {/* Breadcrumbs */}
              <div className="flex min-w-0 items-center gap-2 text-cell font-medium">
                <span className="text-mute">Admin</span>
                <span className="text-faint">/</span>
                <span className="truncate text-ink font-semibold">{pageTitle}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {/* External live site shortcut */}
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-hairline text-xs font-semibold text-mute hover:text-ink hover:bg-bg-alt transition"
              >
                <span>Live Site</span>
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Link>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-mute hover:text-ink hover:bg-hairline rounded-xl transition"
                aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
                title={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
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
