"use client";

import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { BrandLogo, CtaButton, scrollToForm } from "./ui";
import type { SectionProps } from "./types";

type NavProps = SectionProps<"navbar">;

function NavLinks({ ctx, className, onNavigate }: { ctx: NavProps["ctx"]; className: string; onNavigate?: () => void }) {
  return (
    <>
      {ctx.navLinks.map((l) => (
        <a key={l.id} href={`#${l.id}`} onClick={onNavigate} className={className}>
          {l.label}
        </a>
      ))}
    </>
  );
}

/** Variant 1: the original sticky bar (logo, centred links, theme toggle + CTA). */
export function Navbar1({ content, ctx }: NavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo ctx={ctx} />
        </div>
        <nav aria-label="Sections" className="hidden items-center gap-6 text-sm font-medium text-mute md:flex">
          <NavLinks ctx={ctx} className="transition-colors hover:text-ink" />
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <CtaButton className="hidden px-4 py-2 text-xs sm:inline-flex">
            {content.ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

/**
 * Variant 2: centred logo with the links on a second row.
 * Mobile: logo left, controls right (no overlap). Desktop (md+): logo centred, controls pinned right.
 */
export function Navbar2({ content, ctx }: NavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-14 items-center justify-between md:h-16 md:justify-center">
          <div className="flex min-w-0 items-center">
            <BrandLogo ctx={ctx} />
          </div>
          <div className="flex shrink-0 items-center gap-2 md:absolute md:right-0">
            <ThemeToggle />
            <CtaButton className="px-3 py-1.5 text-xs md:hidden">{content.ctaLabel}</CtaButton>
          </div>
        </div>
        <nav aria-label="Sections" className="hidden items-center justify-center gap-8 pb-3 text-sm font-medium text-mute md:flex">
          <NavLinks
            ctx={ctx}
            className="relative py-1 transition-colors hover:text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
          />
          <CtaButton className="px-4 py-1.5 text-xs">
            {content.ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
          </CtaButton>
        </nav>
      </div>
    </header>
  );
}

/** Variant 3: floating pill with a collapsible mobile menu. */
export function Navbar3({ content, ctx }: NavProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="relative mx-auto max-w-5xl rounded-full border border-hairline bg-bg/80 px-4 shadow-lg shadow-accent/5 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between gap-3">
          <BrandLogo ctx={ctx} />
          <nav aria-label="Sections" className="hidden items-center gap-5 text-sm font-medium text-mute md:flex">
            <NavLinks ctx={ctx} className="transition-colors hover:text-ink" />
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <CtaButton className="hidden rounded-full px-4 py-2 text-xs sm:inline-flex">{content.ctaLabel}</CtaButton>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full p-2 text-ink hover:bg-hairline md:hidden"
              aria-expanded={open}
              aria-controls="rt-mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
        {open ? (
          <div id="rt-mobile-menu" className="absolute inset-x-0 top-full mt-2 rounded-3xl border border-hairline bg-card p-3 shadow-xl md:hidden">
            <nav aria-label="Sections" className="flex flex-col">
              <NavLinks ctx={ctx} onNavigate={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-medium text-ink hover:bg-bg-alt" />
            </nav>
            <CtaButton className="mt-2 w-full px-4 py-3 text-sm" onClick={() => {
                setOpen(false);
                scrollToForm();
              }}>
              {content.ctaLabel}
            </CtaButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
