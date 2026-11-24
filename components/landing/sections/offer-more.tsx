"use client";

import { ArrowRight, Check } from "lucide-react";
import { Aurora } from "../fx/backgrounds";
import { StarBorder } from "../fx/interactive";
import { Reveal } from "../motion/Reveal";
import { Container, CtaButton, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type OfferProps = SectionProps<"offer">;

function Tick({ className = "" }: { className?: string }) {
  return (
    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent ${className}`.trim()}>
      <Check className="size-3.5" strokeWidth={3} aria-hidden />
    </span>
  );
}

function Price({ content, light = false, className = "" }: { content: OfferProps["content"]; light?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className={`break-words text-4xl font-extrabold tracking-tight sm:text-5xl ${light ? "" : "text-ink"}`}>{content.priceLabel}</div>
      <div className={`mt-1 text-xs font-medium ${light ? "opacity-85" : "text-mute"}`}>{content.priceNote}</div>
    </div>
  );
}

function Go({ content, className = "" }: { content: OfferProps["content"]; className?: string }) {
  return (
    <CtaButton className={className}>
      {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
    </CtaButton>
  );
}

/** Variant 4: one centred pass on a comet border, the checklist in two columns. */
export function Offer4({ content }: OfferProps) {
  return (
    <Section id="offer" className="py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="mx-auto mt-10 max-w-2xl">
          <StarBorder>
            <div className="p-6 text-center sm:p-10">
              <Price content={content} className="[&>div:first-child]:rt-gradient-text" />
              <ul className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-2">
                {content.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink">
                    <Tick className="mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Go content={content} className="mt-8 w-full px-6 py-3.5 text-base sm:w-auto sm:px-10" />
            </div>
          </StarBorder>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 5: a wide banner. Price panel, checklist and button in one row. */
export function Offer5({ content }: OfferProps) {
  return (
    <Section id="offer" className="rt-tint py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="mt-10 grid overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg lg:grid-cols-[18rem_1fr_auto]">
          <div className="flex flex-col justify-center bg-gradient-to-br from-accent to-accent-2 p-8 text-accent-ink">
            <Price content={content} light />
          </div>
          <ul className="grid gap-3 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-1 xl:grid-cols-2">
            {content.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink">
                <Tick className="mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex items-center border-t border-hairline p-6 sm:p-9 lg:border-l lg:border-t-0">
            <Go content={content} className="w-full whitespace-nowrap px-7 py-3.5 text-sm" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 6: frosted card on an aurora band, the benefits as chips. */
export function Offer6({ content }: OfferProps) {
  return (
    <Section id="offer" className="relative py-16 lg:py-24">
      <Aurora soft fade="y" />
      <Container size="md" className="relative">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="mt-10 rounded-3xl border border-hairline bg-card/80 p-7 text-center shadow-xl backdrop-blur-md sm:p-10">
          <Price content={content} />
          <ul className="mt-7 flex flex-wrap justify-center gap-2.5">
            {content.items.map((item) => (
              <li key={item} className="inline-flex items-center gap-2 rounded-full border border-hairline bg-bg/70 px-3.5 py-2 text-xs font-medium text-ink sm:text-sm">
                <Check className="size-3.5 text-accent" strokeWidth={3} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Go content={content} className="mt-8 w-full px-8 py-4 text-base sm:w-auto" />
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 7: every benefit as its own numbered tile, then a bar carrying the price and the button. */
export function Offer7({ content }: OfferProps) {
  return (
    <Section id="offer" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {content.items.map((item, i) => (
            <Reveal key={item} index={i} spot className="rounded-2xl border border-hairline bg-card p-5 shadow-sm">
              <span className="text-xs font-bold tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 text-sm font-medium leading-snug text-ink">{item}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-5 flex flex-col items-start justify-between gap-5 rounded-3xl bg-gradient-to-r from-accent to-accent-2 p-6 text-accent-ink shadow-xl shadow-accent/20 sm:flex-row sm:items-center sm:p-8">
          <Price content={content} light />
          <button
            type="button"
            onClick={() => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-neutral-900 shadow-lg transition hover:scale-[1.02] active:scale-[0.98] sm:w-auto"
          >
            {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
          </button>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 8: the pass as a stack of cards, two decorative sheets peeking from behind. */
export function Offer8({ content }: OfferProps) {
  return (
    <Section id="offer" className="rt-tint py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="relative mx-auto mt-12 max-w-lg">
          <span aria-hidden className="absolute inset-x-6 -bottom-4 h-full -rotate-2 rounded-3xl border border-hairline bg-card/60" />
          <span aria-hidden className="absolute inset-x-3 -bottom-2 h-full rotate-1 rounded-3xl border border-hairline bg-card/80" />
          <div data-solid className="relative rounded-3xl border border-accent/25 bg-card p-6 shadow-xl sm:p-8">
            <div className="flex items-end justify-between gap-4 border-b border-hairline pb-5">
              <Price content={content} />
              <span className="mb-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{content.eyebrow}</span>
            </div>
            <ul className="mt-5 space-y-3">
              {content.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <Tick className="mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <Go content={content} className="mt-7 w-full px-6 py-3.5 text-base" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 9: one card, price and button across the top, ruled benefit rows underneath. */
export function Offer9({ content }: OfferProps) {
  return (
    <Section id="offer" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="mt-10 overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg">
          <div className="flex flex-col items-start justify-between gap-5 bg-gradient-to-r from-accent/10 to-accent-2/10 p-6 sm:flex-row sm:items-center sm:p-8">
            <Price content={content} />
            <Go content={content} className="w-full px-7 py-3.5 text-sm sm:w-auto" />
          </div>
          <ul className="divide-y divide-hairline">
            {content.items.map((item) => (
              <li key={item} className="flex items-center gap-4 px-6 py-4 text-sm text-ink sm:px-8">
                <Tick />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
