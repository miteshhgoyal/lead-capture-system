"use client";

import { Marquee } from "../motion/Extras";
import { Reveal } from "../motion/Reveal";
import { StatValue, staticValue } from "./kit";
import { Container, Section } from "./ui";
import type { SectionProps } from "./types";

type StatsProps = SectionProps<"stats">;

/** Variant 4: no boxes. Large gradient figures separated by hairlines. */
export function Stats4({ content }: StatsProps) {
  return (
    <Section id="stats" className="py-14 lg:py-20">
      <Container>
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4 md:divide-x md:divide-hairline">
          {content.items.map((item, i) => (
            <Reveal key={item.label} index={i} className="px-3 text-center md:px-8">
              <div className="rt-gradient-text text-4xl font-extrabold tracking-tight sm:text-5xl">
                <StatValue item={item} />
              </div>
              <div className="mt-2 text-xs font-medium text-mute sm:text-sm">{item.label}</div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 60 60" className="size-14 shrink-0 -rotate-90" aria-hidden>
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--hairline-strong)" strokeWidth="5" />
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * pct).toFixed(1)} ${c.toFixed(1)}`} />
    </svg>
  );
}

/** Variant 5: frosted tiles, each with a progress ring beside the figure. */
export function Stats5({ content }: StatsProps) {
  const arcs = [0.82, 0.64, 0.9, 0.72];
  return (
    <Section id="stats" className="py-14 lg:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <Reveal key={item.label} index={i} className="rt-lift flex items-center gap-4 rounded-3xl border border-hairline bg-card/80 p-5 shadow-sm backdrop-blur-sm">
              <Ring pct={arcs[i % arcs.length]} />
              <div className="min-w-0">
                <div className="truncate text-2xl font-extrabold text-ink sm:text-3xl">
                  <StatValue item={item} />
                </div>
                <div className="text-xs font-medium text-mute">{item.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

const SPARKS = [
  "M0 26 L12 22 L24 24 L36 14 L48 18 L60 8 L72 12 L84 4",
  "M0 22 L12 26 L24 16 L36 20 L48 10 L60 14 L72 6 L84 8",
  "M0 28 L12 20 L24 22 L36 12 L48 16 L60 10 L72 14 L84 3",
  "M0 24 L12 18 L24 24 L36 10 L48 14 L60 6 L72 12 L84 5",
];

/** Variant 6: spotlight tiles with a tiny rising price line under each figure. */
export function Stats6({ content }: StatsProps) {
  return (
    <Section id="stats" className="rt-tint py-14 lg:py-20">
      <Container>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <Reveal key={item.label} index={i} spot className="overflow-hidden rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-6">
              <div className="text-2xl font-extrabold text-ink sm:text-4xl">
                <StatValue item={item} />
              </div>
              <div className="mt-1 text-xs font-medium text-mute sm:text-sm">{item.label}</div>
              <svg viewBox="0 0 84 32" className="mt-4 h-8 w-full" preserveAspectRatio="none" aria-hidden>
                <path d={SPARKS[i % SPARKS.length]} fill="none" stroke="var(--up)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 7: one hero figure on a brand card, the rest as a ruled list. */
export function Stats7({ content }: StatsProps) {
  const [lead, ...rest] = content.items;
  return (
    <Section id="stats" className="py-14 lg:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          {lead ? (
            <Reveal className="rounded-3xl bg-gradient-to-br from-accent to-accent-2 p-8 text-accent-ink shadow-xl shadow-accent/20 lg:col-span-5 lg:p-10">
              <div className="text-5xl font-extrabold tracking-tight sm:text-6xl">
                <StatValue item={lead} />
              </div>
              <div className="mt-2 text-sm font-medium opacity-90">{lead.label}</div>
            </Reveal>
          ) : null}
          <div className="divide-y divide-hairline rounded-3xl border border-hairline bg-card shadow-sm lg:col-span-7">
            {rest.map((item, i) => (
              <Reveal key={item.label} index={i} className="flex items-baseline justify-between gap-4 px-6 py-5 sm:px-8">
                <span className="text-sm font-medium text-mute">{item.label}</span>
                <span className="text-2xl font-extrabold text-ink sm:text-3xl">
                  <StatValue item={item} />
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 8: two opposing tickers of large figures. */
export function Stats8({ content }: StatsProps) {
  const row = content.items.map((item) => (
    <div key={item.label} className="flex items-baseline gap-3 whitespace-nowrap rounded-full border border-hairline bg-card px-7 py-4">
      <span className="text-3xl font-extrabold text-accent">{staticValue(item)}</span>
      <span className="text-sm font-medium text-mute">{item.label}</span>
    </div>
  ));
  return (
    <Section id="stats" className="space-y-4 py-10">
      <Marquee gap={20} durationSeconds={34}>
        {row}
      </Marquee>
      <Marquee gap={20} durationSeconds={42} className="[&_.rt-marquee-track]:[animation-direction:reverse]">
        {[...row].reverse()}
      </Marquee>
    </Section>
  );
}

/** Variant 9: a terminal-style panel: window dots, a LIVE tag and green figures. */
export function Stats9({ content }: StatsProps) {
  return (
    <Section id="stats" className="py-14 lg:py-20">
      <Container size="lg">
        <Reveal className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-hairline bg-bg-alt/70 px-5 py-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-down/70" />
              <span className="size-2.5 rounded-full bg-gold/80" />
              <span className="size-2.5 rounded-full bg-up/70" />
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-up">
              <span className="size-1.5 animate-pulse rounded-full bg-up" /> LIVE
            </span>
          </div>
          <div className="grid grid-cols-2 divide-hairline md:grid-cols-4 md:divide-x">
            {content.items.map((item, i) => (
              <div key={item.label} className={`p-6 sm:p-7 ${i >= 2 ? "border-t border-hairline md:border-t-0" : ""}`}>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-mute">{item.label}</div>
                <div className="mt-2 flex items-baseline gap-2 font-mono text-2xl font-bold text-ink tabular-nums sm:text-3xl">
                  <StatValue item={item} />
                  <span className="text-xs text-up" aria-hidden>
                    ▲
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
