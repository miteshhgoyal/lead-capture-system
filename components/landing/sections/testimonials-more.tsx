"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Marquee } from "../motion/Extras";
import { usePrefersReducedMotion } from "../motion/hooks";
import { Reveal } from "../motion/Reveal";
import { Byline, Avatar, fillTo } from "./kit";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type TestimonialsProps = SectionProps<"testimonials">;

/** Variant 4: masonry columns of spotlight cards. */
export function Testimonials4({ content, ctx }: TestimonialsProps) {
  return (
    <Section id="reviews" className="rt-tint py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5">
          {ctx.testimonials.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} index={i % 3} spot as="figure" className="break-inside-avoid rounded-3xl border border-hairline bg-card p-6 shadow-sm">
              <Quote className="size-6 text-accent/40" aria-hidden />
              <blockquote className="mt-3 text-sm leading-relaxed text-ink">{t.quote}</blockquote>
              <figcaption className="mt-5">
                <Byline t={t} />
              </figcaption>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 5: two tickers of quote cards moving in opposite directions. */
export function Testimonials5({ content, ctx }: TestimonialsProps) {
  const cards = fillTo(ctx.testimonials, 6);
  const card = (t: (typeof cards)[number], i: number) => (
    <figure key={i} className="w-[19rem] shrink-0 rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:w-[22rem]">
      <blockquote className="text-sm leading-relaxed text-ink">{t.quote}</blockquote>
      <figcaption className="mt-5">
        <Byline t={t} />
      </figcaption>
    </figure>
  );
  return (
    <Section id="reviews" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      </Container>
      <div className="mt-12 space-y-5">
        <Marquee gap={20} durationSeconds={70}>
          {cards.map(card)}
        </Marquee>
        <Marquee gap={20} durationSeconds={84} className="[&_.rt-marquee-track]:[animation-direction:reverse]">
          {[...cards].reverse().map(card)}
        </Marquee>
      </div>
    </Section>
  );
}

/** Variant 6: the first quote told large, the rest as a row beneath it. */
export function Testimonials6({ content, ctx }: TestimonialsProps) {
  const [lead, ...rest] = ctx.testimonials;
  return (
    <Section id="reviews" className="rt-tint py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        {lead ? (
          <Reveal as="figure" className="relative mt-12 overflow-hidden rounded-3xl border border-hairline bg-card p-8 shadow-lg sm:p-12">
            <Quote aria-hidden className="absolute right-6 top-6 size-20 text-accent/10 sm:size-28" />
            <blockquote className="relative max-w-3xl text-xl font-semibold leading-snug text-ink sm:text-2xl">{lead.quote}</blockquote>
            <figcaption className="relative mt-8">
              <Byline t={lead} />
            </figcaption>
          </Reveal>
        ) : null}
        {rest.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((t, i) => (
              <Reveal key={`${t.name}-${i}`} index={i % 3} as="figure" className="rt-lift rounded-3xl border border-hairline bg-card p-6 shadow-sm">
                <blockquote className="text-sm leading-relaxed text-ink">{t.quote}</blockquote>
                <figcaption className="mt-5">
                  <Byline t={t} />
                </figcaption>
              </Reveal>
            ))}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

/** Variant 7: one quote at a time, auto-advancing, with dots and arrows. */
export function Testimonials7({ content, ctx }: TestimonialsProps) {
  const items = ctx.testimonials;
  const n = items.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (n < 2 || paused || reduced) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % n), 6500);
    return () => window.clearInterval(id);
  }, [n, paused, reduced]);
  const t = items[i % Math.max(n, 1)];
  const go = (d: number) => setI((v) => (v + d + n) % n);
  return (
    <Section id="reviews" className="py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        {t ? (
          <div
            className="mt-12 text-center"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <Quote className="mx-auto size-9 text-accent/40" aria-hidden />
            <figure key={i} aria-live="polite" className="rt-reveal-eager mx-auto mt-4 max-w-2xl" style={{ ["--rt-dur" as string]: "500ms", ["--rt-dist" as string]: "10px" }}>
              <blockquote className="text-lg font-medium leading-relaxed text-ink sm:text-xl">{t.quote}</blockquote>
              <figcaption className="mt-6 flex justify-center">
                <Byline t={t} />
              </figcaption>
            </figure>
            {n > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button type="button" onClick={() => go(-1)} aria-label="Previous testimonial" className="rounded-full border border-hairline bg-card p-2 text-ink transition hover:bg-bg-alt">
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <div className="flex gap-2" role="tablist" aria-label="Choose testimonial">
                  {items.map((_, d) => (
                    <button key={d} type="button" role="tab" aria-selected={d === i} aria-label={`Testimonial ${d + 1}`} onClick={() => setI(d)} className={`h-2 rounded-full transition-all ${d === i ? "w-6 bg-accent" : "w-2 bg-hairline-strong"}`} />
                  ))}
                </div>
                <button type="button" onClick={() => go(1)} aria-label="Next testimonial" className="rounded-full border border-hairline bg-card p-2 text-ink transition hover:bg-bg-alt">
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Container>
    </Section>
  );
}

/** Variant 8: a chat thread. Quotes as message bubbles, alternating sides. */
export function Testimonials8({ content, ctx }: TestimonialsProps) {
  return (
    <Section id="reviews" className="rt-tint py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 space-y-6">
          {ctx.testimonials.map((t, i) => {
            const mine = i % 2 === 1;
            return (
              <Reveal key={`${t.name}-${i}`} index={i % 3} className={`flex items-end gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                <Avatar name={t.name} className="size-9" />
                <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? "items-end text-right" : ""}`}>
                  <div className="mb-1 px-1 text-xs font-semibold text-mute">
                    {t.name}
                    {t.role ? <span className="font-normal"> · {t.role}</span> : null}
                  </div>
                  <p className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${mine ? "rounded-br-md bg-accent text-accent-ink" : "rounded-bl-md border border-hairline bg-card text-ink"}`}>{t.quote}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 9: loosely pinned cards, each tilted a few degrees until you hover. */
export function Testimonials9({ content, ctx }: TestimonialsProps) {
  const tilt = ["-rotate-1", "rotate-1", "rotate-[0.6deg]", "-rotate-[0.8deg]", "rotate-1", "-rotate-1"];
  return (
    <Section id="reviews" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-14 grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
          {ctx.testimonials.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} index={i % 3} as="figure" className={`relative rounded-3xl border border-hairline bg-card p-6 pt-8 shadow-md transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] ${tilt[i % tilt.length]}`}>
              <span aria-hidden className="absolute left-1/2 top-0 h-3.5 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-accent to-accent-2 opacity-80" />
              <blockquote className="text-sm leading-relaxed text-ink">{t.quote}</blockquote>
              <figcaption className="mt-5">
                <Byline t={t} />
              </figcaption>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
