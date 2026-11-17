"use client";

import type { PageContext, SectionProps } from "./types";
import { BrandLogo } from "./ui";

type FooterProps = SectionProps<"footer">;

function Disclaimer({ ctx }: { ctx: PageContext }) {
  return (
    <div className="rounded-2xl border border-hairline bg-card/60 p-4 text-[11px] leading-relaxed text-faint">
      <b className="font-semibold text-mute">Risk Disclaimer: </b>
      {ctx.disclaimer}
    </div>
  );
}

function Copyright({ ctx }: { ctx: PageContext }) {
  return (
    <div>
      © {new Date().getFullYear()} {ctx.brandName}. All rights reserved.
    </div>
  );
}

/** Variant 1: the original two-part footer with the risk disclaimer beneath. */
export function Footer1({ content, ctx }: FooterProps) {
  return (
    <footer className="border-t border-hairline bg-bg-alt/80 py-12 text-xs text-mute">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">{ctx.brandName}</span>
            <span>·</span>
            <span>{content.tagline}</span>
          </div>
          <Copyright ctx={ctx} />
        </div>
        <div className="mt-8">
          <Disclaimer ctx={ctx} />
        </div>
      </div>
    </footer>
  );
}

/** Variant 2: centred stack with the section links in a row. */
export function Footer2({ content, ctx }: FooterProps) {
  return (
    <footer className="border-t border-hairline bg-bg-alt/80 py-12 text-center text-xs text-mute">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex justify-center">
          <BrandLogo ctx={ctx} />
        </div>
        <p className="mt-3 text-sm font-semibold text-ink">{ctx.brandName}</p>
        <p className="mt-1">{content.tagline}</p>
        <nav aria-label="Footer" className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium">
          {ctx.navLinks.map((l) => (
            <a key={l.id} href={`#${l.id}`} className="hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="mt-8 text-left">
          <Disclaimer ctx={ctx} />
        </div>
        <div className="mt-6">
          <Copyright ctx={ctx} />
        </div>
      </div>
    </footer>
  );
}

/** Variant 3: three columns (brand, links, disclaimer) over a copyright bar. */
export function Footer3({ content, ctx }: FooterProps) {
  return (
    <footer className="border-t border-hairline bg-bg-alt/80 pt-12 text-xs text-mute">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-4">
          <BrandLogo ctx={ctx} />
          <p className="mt-3 text-sm font-semibold text-ink">{ctx.brandName}</p>
          <p className="mt-1">{content.tagline}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <ul className="space-y-2 font-medium">
            {ctx.navLinks.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-5">
          <Disclaimer ctx={ctx} />
        </div>
      </div>
      <div className="mt-10 border-t border-hairline py-5 text-center">
        <Copyright ctx={ctx} />
      </div>
    </footer>
  );
}
