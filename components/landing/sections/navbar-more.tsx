"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { ScrollProgress, ShinyText, StarBorder, useScrolled } from "../fx/interactive";
import { ThemeToggle } from "../ThemeToggle";
import { NavLinks } from "./navbar";
import { BrandLogo, CtaButton, scrollToForm } from "./ui";
import type { SectionProps } from "./types";

type NavProps = SectionProps<"navbar">;

/** Id of the section currently crossing the upper part of the viewport (for active-link styling). */
function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");
  useEffect(() => {
    const els = key
      .split("|")
      .map((id) => (id ? document.getElementById(id) : null))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.5] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

/** Variant 4: transparent over the hero, turns into a frosted bar once the page scrolls. */
export function Navbar4({ content, ctx }: NavProps) {
  const scrolled = useScrolled(12);
  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled ? "border-hairline bg-bg/80 shadow-sm backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8 ${scrolled ? "h-14" : "h-[4.5rem]"}`}>
        <BrandLogo ctx={ctx} />
        <div className="flex items-center gap-6">
          <nav aria-label="Sections" className="hidden items-center gap-6 text-sm font-medium text-mute md:flex">
            <NavLinks ctx={ctx} className="transition-colors hover:text-ink" />
          </nav>
          <ThemeToggle />
          <CtaButton className="hidden px-4 py-2 text-xs sm:inline-flex">
            {content.ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

/** Variant 5: logo left, links in a segmented pill in the middle, CTA right. */
export function Navbar5({ content, ctx }: NavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <BrandLogo ctx={ctx} />
        <nav aria-label="Sections" className="hidden items-center gap-1 rounded-full border border-hairline bg-card/70 p-1 text-sm font-medium text-mute shadow-sm md:flex">
          <NavLinks ctx={ctx} className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-accent/10 hover:text-accent" />
        </nav>
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <CtaButton className="hidden px-4 py-2 text-xs sm:inline-flex">
            {content.ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

/** Variant 6: a thin brand-coloured announcement strip (the trust line) above a clean sticky bar. */
export function Navbar6({ content, ctx }: NavProps) {
  return (
    <>
      <div className="relative z-40 bg-gradient-to-r from-accent to-accent-2 px-4 py-1.5 text-center text-[11px] font-semibold text-accent-ink sm:text-xs">
        <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-accent-ink align-middle" aria-hidden />
        {ctx.trustLine}
      </div>
      <header className="sticky top-0 z-40 border-b border-hairline bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BrandLogo ctx={ctx} className="h-8" />
          <nav aria-label="Sections" className="hidden items-center gap-7 text-sm font-medium text-mute md:flex">
            <NavLinks ctx={ctx} className="transition-colors hover:text-ink" />
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CtaButton className="px-3.5 py-1.5 text-xs">{content.ctaLabel}</CtaButton>
          </div>
        </div>
      </header>
    </>
  );
}

/** Variant 7: a floating pill with a comet of light orbiting its border. */
export function Navbar7({ content, ctx }: NavProps) {
  return (
    <div className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <StarBorder rounded="rounded-full">
          <div className="flex h-14 items-center justify-between gap-3 rounded-full bg-bg/90 px-4 backdrop-blur-md sm:px-5">
            <BrandLogo ctx={ctx} className="h-8" />
            <nav aria-label="Sections" className="hidden items-center gap-6 text-sm font-medium text-mute md:flex">
              <NavLinks ctx={ctx} className="transition-colors hover:text-ink" />
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <CtaButton className="rounded-full px-4 py-2 text-xs">
                <ShinyText className="!text-inherit">{content.ctaLabel}</ShinyText>
              </CtaButton>
            </div>
          </div>
        </StarBorder>
      </div>
    </div>
  );
}

/** Variant 8: minimal bar; the links live in a slide-in drawer on every screen size. */
export function Navbar8({ content, ctx }: NavProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-hairline/70 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo ctx={ctx} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CtaButton className="hidden px-4 py-2 text-xs sm:inline-flex">
              {content.ctaLabel} <ArrowRight className="size-3.5" aria-hidden />
            </CtaButton>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="rt-drawer"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="inline-flex items-center justify-center rounded-xl border border-hairline p-2 text-ink transition hover:bg-bg-alt"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <aside id="rt-drawer" role="dialog" aria-modal="true" aria-label="Menu" className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col border-l border-hairline bg-bg p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <BrandLogo ctx={ctx} className="h-8" />
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-xl p-2 text-ink hover:bg-bg-alt">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <nav aria-label="Sections" className="mt-8 flex flex-1 flex-col gap-1">
              <NavLinks ctx={ctx} onNavigate={() => setOpen(false)} className="rounded-2xl px-4 py-3.5 text-lg font-semibold text-ink transition hover:bg-accent/10 hover:text-accent" />
            </nav>
            <CtaButton
              className="w-full px-5 py-3.5 text-sm"
              onClick={() => {
                setOpen(false);
                scrollToForm();
              }}
            >
              {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
            </CtaButton>
          </aside>
        </div>
      ) : null}
    </>
  );
}

/** Variant 9: compact bar that highlights the section you are reading and fills a progress line as you scroll. */
export function Navbar9({ content, ctx }: NavProps) {
  const active = useActiveSection(ctx.navLinks.map((l) => l.id));
  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo ctx={ctx} className="h-8" />
        <nav aria-label="Sections" className="hidden items-center gap-1 text-sm font-medium md:flex">
          {ctx.navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? "true" : undefined}
              className={`rounded-lg px-3 py-1.5 transition-colors ${active === l.id ? "bg-accent/10 text-accent" : "text-mute hover:text-ink"}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CtaButton className="px-3.5 py-1.5 text-xs">{content.ctaLabel}</CtaButton>
        </div>
      </div>
      <div className="relative h-0.5 bg-hairline">
        <ScrollProgress className="absolute inset-0 h-full" />
      </div>
    </header>
  );
}
