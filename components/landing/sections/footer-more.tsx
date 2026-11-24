"use client";

import { Aurora } from "../fx/backgrounds";
import { BrandLogo } from "./ui";
import type { PageContext, SectionProps } from "./types";

type FooterProps = SectionProps<"footer">;

function Disclaimer({ ctx, className = "" }: { ctx: PageContext; className?: string }) {
  return (
    <div className={`rounded-2xl border border-hairline bg-card/60 p-4 text-[11px] leading-relaxed text-faint ${className}`.trim()}>
      <b className="font-semibold text-mute">Risk Disclaimer: </b>
      {ctx.disclaimer}
    </div>
  );
}

function Copyright({ ctx }: { ctx: PageContext }) {
  return (
    <span>
      © {new Date().getFullYear()} {ctx.brandName}. All rights reserved.
    </span>
  );
}

function Links({ ctx, className }: { ctx: PageContext; className: string }) {
  return (
    <>
      {ctx.navLinks.map((l) => (
        <a key={l.id} href={`#${l.id}`} className={className}>
          {l.label}
        </a>
      ))}
    </>
  );
}

/** Variant 4: a giant faint wordmark closes the page. */
export function Footer4({ content, ctx }: FooterProps) {
  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-bg-alt/80 pt-12 text-xs text-mute">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div className="max-w-sm">
            <BrandLogo ctx={ctx} />
            <p className="mt-3">{content.tagline}</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium md:justify-end">
            <Links ctx={ctx} className="hover:text-ink" />
          </nav>
        </div>
        <Disclaimer ctx={ctx} className="mt-8" />
        <div className="mt-6">
          <Copyright ctx={ctx} />
        </div>
      </div>
      <div aria-hidden className="rt-outline-text pointer-events-none mt-4 select-none overflow-hidden whitespace-nowrap text-center text-[18vw] font-extrabold uppercase leading-[0.8] opacity-40">
        {ctx.brandName}
      </div>
    </footer>
  );
}

/** Variant 5: brand and links on one row, disclaimer and copyright below. */
export function Footer5({ content, ctx }: FooterProps) {
  return (
    <footer className="border-t border-hairline bg-bg-alt/80 py-10 text-xs text-mute">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <BrandLogo ctx={ctx} className="h-8" />
            <span className="hidden max-w-xs sm:block">{content.tagline}</span>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
            <Links ctx={ctx} className="hover:text-ink" />
          </nav>
        </div>
        <Disclaimer ctx={ctx} className="mt-6" />
        <div className="mt-5 flex flex-col justify-between gap-1 sm:flex-row">
          <Copyright ctx={ctx} />
          <span className="sm:hidden">{content.tagline}</span>
        </div>
      </div>
    </footer>
  );
}

/** Variant 6: centred, links as pills, a hairline that fades out at both ends. */
export function Footer6({ content, ctx }: FooterProps) {
  return (
    <footer className="relative bg-bg-alt/80 py-12 text-center text-xs text-mute">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex justify-center">
          <BrandLogo ctx={ctx} />
        </div>
        <p className="mt-3">{content.tagline}</p>
        <nav aria-label="Footer" className="mt-6 flex flex-wrap justify-center gap-2">
          <Links ctx={ctx} className="rounded-full border border-hairline bg-card/70 px-3.5 py-1.5 font-medium transition hover:border-accent/40 hover:text-accent" />
        </nav>
        <Disclaimer ctx={ctx} className="mt-8 text-left" />
        <div className="mt-6">
          <Copyright ctx={ctx} />
        </div>
      </div>
    </footer>
  );
}

/** Variant 7: four columns: brand, links (split in two) and the disclaimer. */
export function Footer7({ content, ctx }: FooterProps) {
  const half = Math.ceil(ctx.navLinks.length / 2);
  const cols = [ctx.navLinks.slice(0, half), ctx.navLinks.slice(half)];
  return (
    <footer className="border-t border-hairline bg-bg-alt/80 pt-12 text-xs text-mute">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="col-span-2 md:col-span-4">
          <BrandLogo ctx={ctx} />
          <p className="mt-3">{content.tagline}</p>
        </div>
        {cols.map((col, c) => (
          <nav key={c} aria-label={`Footer ${c + 1}`} className="md:col-span-2">
            <ul className="space-y-2.5 font-medium">
              {col.map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="hover:text-ink">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="col-span-2 md:col-span-4">
          <Disclaimer ctx={ctx} />
        </div>
      </div>
      <div className="mt-10 border-t border-hairline py-5 text-center">
        <Copyright ctx={ctx} />
      </div>
    </footer>
  );
}

/** Variant 8: the quietest option. One line, then the disclaimer. */
export function Footer8({ content, ctx }: FooterProps) {
  return (
    <footer className="border-t border-hairline bg-bg-alt/80 py-8 text-xs text-mute">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <div>
            <span className="font-bold text-ink">{ctx.brandName}</span> <span aria-hidden>·</span> {content.tagline}
          </div>
          <Copyright ctx={ctx} />
        </div>
        <p className="mt-5 text-[11px] leading-relaxed text-faint">
          <b className="font-semibold text-mute">Risk Disclaimer: </b>
          {ctx.disclaimer}
        </p>
      </div>
    </footer>
  );
}

/** Variant 9: a rounded card rising out of a soft aurora, so the page ends on a floating panel. */
export function Footer9({ content, ctx }: FooterProps) {
  return (
    <footer className="relative overflow-hidden px-3 pt-16 text-xs text-mute sm:px-6">
      <Aurora soft fade="t" />
      <div className="relative mx-auto max-w-6xl rounded-t-[2.25rem] border border-b-0 border-hairline bg-card/85 px-6 pb-8 pt-10 shadow-2xl backdrop-blur-md sm:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <BrandLogo ctx={ctx} />
            <p className="mt-3 max-w-sm">{content.tagline}</p>
          </div>
          <nav aria-label="Footer" className="md:col-span-3">
            <ul className="space-y-2.5 font-medium">
              <Items ctx={ctx} />
            </ul>
          </nav>
          <div className="md:col-span-4">
            <Disclaimer ctx={ctx} />
          </div>
        </div>
        <div className="mt-8 border-t border-hairline pt-5 text-center">
          <Copyright ctx={ctx} />
        </div>
      </div>
    </footer>
  );
}

function Items({ ctx }: { ctx: PageContext }) {
  return (
    <>
      {ctx.navLinks.map((l) => (
        <li key={l.id}>
          <a href={`#${l.id}`} className="hover:text-ink">
            {l.label}
          </a>
        </li>
      ))}
    </>
  );
}
