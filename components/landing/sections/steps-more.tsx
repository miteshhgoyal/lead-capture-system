"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type StepsProps = SectionProps<"steps">;

const pad = (i: number) => String(i + 1).padStart(2, "0");

/** Variant 4: three cards with giant outlined numerals, joined by a dashed line on desktop. */
export function Steps4({ content }: StepsProps) {
  return (
    <Section id="how" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="relative mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <span aria-hidden className="absolute left-[10%] right-[10%] top-12 hidden border-t-2 border-dashed border-accent/30 md:block" />
          {content.items.map((step, i) => (
            <Reveal key={step.title} index={i} spot className="rt-lift relative rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
              <span className="rt-outline-text block text-7xl font-extrabold leading-none tabular-nums">{pad(i)}</span>
              <h3 className="rt-h mt-5 text-lg font-bold text-ink sm:text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 5: a centre spine with the steps alternating left and right (single column on mobile). */
export function Steps5({ content }: StepsProps) {
  return (
    <Section id="how" className="rt-tint py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="relative mt-14 space-y-10 before:absolute before:bottom-2 before:left-5 before:top-2 before:w-0.5 before:bg-gradient-to-b before:from-accent/50 before:via-accent/25 before:to-transparent md:before:left-1/2 md:before:-translate-x-1/2">
          {content.items.map((step, i) => {
            const right = i % 2 === 1;
            return (
              <Reveal key={step.title} as="li" index={i} className="relative pl-14 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                <span className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink ring-4 ring-bg md:left-1/2 md:-translate-x-1/2">{i + 1}</span>
                <div className={`rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-6 ${right ? "md:col-start-2" : "md:col-start-1 md:text-right"}`}>
                  <h3 className="rt-h text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{step.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}

/** Variant 6: a staircase. Each step stands higher than the last, the way the results are meant to. */
export function Steps6({ content }: StepsProps) {
  const n = content.items.length;
  const rise = (i: number) => (n > 1 ? i / (n - 1) : 0);
  return (
    <Section id="how" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end md:gap-5">
          {content.items.map((step, i) => (
            <Reveal key={step.title} as="li" index={i} className="relative overflow-hidden rounded-3xl border border-hairline bg-card shadow-sm">
              <div style={{ minHeight: `${9 + rise(i) * 8}rem` }} className="flex flex-col justify-between p-6 sm:p-7 max-md:!min-h-0">
                <div className="flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-base font-bold text-accent-ink">{i + 1}</span>
                  <ArrowUpRight className="size-6 text-accent" aria-hidden style={{ opacity: 0.35 + rise(i) * 0.65 }} />
                </div>
                <div className="mt-6">
                  <h3 className="rt-h text-lg font-bold text-ink sm:text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mute">{step.body}</p>
                </div>
              </div>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent to-accent-2" style={{ opacity: 0.3 + rise(i) * 0.7 }} />
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/** Variant 7: an interactive stepper with a progress line; pick a step to read it. */
export function Steps7({ content }: StepsProps) {
  const [active, setActive] = useState(0);
  const n = content.items.length;
  const step = content.items[active] ?? content.items[0];
  return (
    <Section id="how" className="rt-tint py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="relative mt-12">
          <div aria-hidden className="absolute left-[8%] right-[8%] top-5 h-0.5 rounded-full bg-hairline" />
          <div aria-hidden className="absolute left-[8%] top-5 h-0.5 rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-500" style={{ width: `${n > 1 ? (active / (n - 1)) * 84 : 0}%` }} />
          <div role="tablist" aria-label={content.title} className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {content.items.map((s, i) => (
              <button key={s.title} type="button" role="tab" aria-selected={i === active} aria-controls="step-panel" onClick={() => setActive(i)} className="group flex flex-col items-center gap-2 px-1 text-center">
                <span className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ring-4 ring-bg transition ${i <= active ? "bg-accent text-accent-ink" : "bg-card text-mute ring-offset-0 border border-hairline-strong"}`}>{i + 1}</span>
                <span className={`hidden text-xs font-semibold transition sm:block ${i === active ? "text-ink" : "text-mute group-hover:text-ink"}`}>{s.title}</span>
              </button>
            ))}
          </div>
        </div>
        <div id="step-panel" role="tabpanel" className="mx-auto mt-10 max-w-2xl rounded-3xl border border-hairline bg-card p-6 text-center shadow-sm sm:p-9">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            {active + 1} / {n}
          </span>
          <h3 className="rt-h mt-2 text-xl font-bold text-ink sm:text-2xl">{step.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{step.body}</p>
          {active < n - 1 ? (
            <button type="button" onClick={() => setActive(active + 1)} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              Next step <ArrowRight className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 8: numbered nodes joined by an animated dashed line, copy in frosted cards beneath. */
export function Steps8({ content }: StepsProps) {
  return (
    <Section id="how" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          <svg aria-hidden className="absolute left-[16.7%] right-[16.7%] top-6 hidden h-1 w-[66.6%] md:block" preserveAspectRatio="none">
            <line x1="0" y1="2" x2="100%" y2="2" stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="2" className="rt-dash" />
          </svg>
          {content.items.map((step, i) => (
            <Reveal key={step.title} as="li" index={i} className="relative flex flex-col items-center text-center">
              <span className="relative flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-lg font-bold text-accent-ink shadow-lg shadow-accent/30 ring-8 ring-bg">{i + 1}</span>
              <div className="mt-5 w-full rounded-3xl border border-hairline bg-card/80 p-5 shadow-sm backdrop-blur-sm">
                <h3 className="rt-h text-base font-bold text-ink sm:text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/** Variant 9: compact rows with a spotlight that follows the cursor. */
export function Steps9({ content }: StepsProps) {
  return (
    <Section id="how" className="rt-tint py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="mt-10 space-y-3">
          {content.items.map((step, i) => (
            <Reveal key={step.title} as="li" index={i} spot className="flex items-center gap-4 overflow-hidden rounded-2xl border border-hairline bg-card p-4 shadow-sm sm:gap-6 sm:p-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg font-extrabold tabular-nums text-accent">{pad(i)}</span>
              <div className="min-w-0 flex-1">
                <h3 className="rt-h text-base font-bold text-ink sm:text-lg">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-mute">{step.body}</p>
              </div>
              <ArrowRight className="hidden size-5 shrink-0 text-accent/60 sm:block" aria-hidden />
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
