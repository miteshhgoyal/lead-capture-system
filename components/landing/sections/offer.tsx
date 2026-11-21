"use client";

import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import { Container, CtaButton, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type OfferProps = SectionProps<"offer">;

function Checklist({ items, columns = false }: { items: string[]; columns?: boolean }) {
  return (
    <ul className={`grid gap-3 ${columns ? "sm:grid-cols-2" : ""}`}>
      {items.map((item, i) => (
        <Reveal key={item} as="li" index={i} className="flex items-start gap-3 text-sm text-ink">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
          {item}
        </Reveal>
      ))}
    </ul>
  );
}

function PriceBlock({ content }: { content: OfferProps["content"] }) {
  return (
    <div className="min-w-0">
      <div className="break-words text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{content.priceLabel}</div>
      <div className="mt-1 text-xs font-medium text-mute">{content.priceNote}</div>
    </div>
  );
}

/** Variant 1: single centred pass card. */
export function Offer1({ content }: OfferProps) {
  return (
    <Section id="offer" className="py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="mx-auto mt-10 max-w-lg rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card p-6 text-center shadow-xl sm:p-8">
          <PriceBlock content={content} />
          <div className="my-6 border-t border-hairline" />
          <div className="text-left">
            <Checklist items={content.items} />
          </div>
          <CtaButton className="mt-8 w-full px-6 py-3.5 text-base">
            {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
          </CtaButton>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 2: copy and button on the left, the checklist in a card on the right. */
export function Offer2({ content }: OfferProps) {
  return (
    <Section id="offer" className="bg-bg-alt/40 py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            {/* Wraps on narrow screens so the price and button never overflow */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <PriceBlock content={content} />
              <CtaButton className="px-6 py-3.5 text-sm">
                {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
              </CtaButton>
            </div>
          </div>
          <Reveal className="rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-9">
            <Checklist items={content.items} />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 3: ticket with a perforated stub. */
export function Offer3({ content }: OfferProps) {
  return (
    <Section id="offer" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <Reveal className="mt-10 flex flex-col overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg md:flex-row">
          <div className="flex-1 p-6 sm:p-9">
            <Checklist items={content.items} columns />
          </div>
          <div className="relative flex flex-col items-center justify-center gap-5 border-t-2 border-dashed border-hairline-strong bg-gradient-to-br from-accent/10 to-accent-2/10 p-6 text-center sm:p-7 md:w-72 md:border-l-2 md:border-t-0">
            <PriceBlock content={content} />
            <CtaButton className="w-full px-5 py-3 text-sm">
              {content.ctaLabel} <ArrowRight className="size-4" aria-hidden />
            </CtaButton>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
