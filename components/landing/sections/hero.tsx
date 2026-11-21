"use client";

import { ArrowDown } from "lucide-react";
import { Icon } from "@/components/ui/icons";
import { AnimatedText } from "../motion/AnimatedText";
import { FloatingShapes, GradientText, Marquee, Parallax } from "../motion/Extras";
import { Reveal } from "../motion/Reveal";
import { CtaButton, HeroForm } from "./ui";
import type { SectionProps } from "./types";
import type { HeroHighlight } from "@/lib/page-builder/types";

type HeroProps = SectionProps<"hero">;

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card/60 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
      <span className="flex size-2 animate-pulse rounded-full bg-up" />
      <span className="text-mute">{text}</span>
    </div>
  );
}

function HighlightCard({ item, index }: { item: HeroHighlight; index: number }) {
  const tone = index % 2 === 0 ? "bg-accent/10 text-accent" : "bg-accent-2/15 text-accent";
  return (
    <Reveal
      index={index}
      className="rt-lift flex items-center gap-3 rounded-2xl border border-hairline bg-card/70 p-3.5 backdrop-blur-sm"
    >
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon name={item.icon} className="size-4" strokeWidth={2.5} />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-ink">{item.title}</h4>
        <p className="text-[11px] text-mute">{item.body}</p>
      </div>
    </Reveal>
  );
}

function MobileJump({ label }: { label: string }) {
  return (
    <div className="mt-8 block lg:hidden">
      <CtaButton className="w-full py-3.5 text-center">
        {label} <ArrowDown className="size-4" aria-hidden />
      </CtaButton>
    </div>
  );
}

const H1 = "rt-h mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl";

/** Variant 1: the original split hero (copy left, sticky form right). */
export function Hero1({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Reveal eager>
              <TrustBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[54px] lg:leading-[1.12]`} />
            <Reveal eager delay={200} as="p" className="mt-4 max-w-2xl text-base text-mute sm:text-lg">
              {content.subheadline}
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {content.highlights.map((h, i) => (
                <HighlightCard key={h.title} item={h} index={i} />
              ))}
            </div>
            <MobileJump label={content.mobileCta} />
          </div>
          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <HeroForm ctx={ctx} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Variant 2: centred headline with the form directly beneath. */
export function Hero2({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal eager>
          <TrustBadge text={content.badge || ctx.trustLine} />
        </Reveal>
        <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-6xl lg:leading-[1.08]`} />
        <Reveal eager delay={200} as="p" className="mx-auto mt-4 max-w-2xl text-base text-mute sm:text-lg">
          {content.subheadline}
        </Reveal>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {content.highlights.map((h, i) => (
            <Reveal key={h.title} as="li" index={i} eager delay={300} className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card/70 px-3.5 py-1.5 text-xs font-semibold text-ink">
              <Icon name={h.icon} className="size-3.5 text-accent" strokeWidth={2.5} />
              {h.title}
            </Reveal>
          ))}
        </ul>
      </div>
      <div className="mx-auto mt-10 max-w-xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-b from-accent/25 to-transparent p-px">
          <HeroForm ctx={ctx} />
        </div>
      </div>
    </section>
  );
}

/** Variant 3: form on the left, copy and a vertical highlight list on the right, ticker underneath. */
export function Hero3({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 lg:pt-14 lg:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <div className="rounded-[2rem] bg-bg-alt/70 p-3 ring-1 ring-hairline">
              <HeroForm ctx={ctx} />
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7">
            <Reveal eager>
              <TrustBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[50px] lg:leading-[1.1]`} />
            <Reveal eager delay={200} as="p" className="mt-4 max-w-xl text-base text-mute sm:text-lg">
              {content.subheadline}
            </Reveal>
            <ul className="mt-7 divide-y divide-hairline rounded-2xl border border-hairline bg-card/60">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} as="li" index={i} className="flex items-start gap-4 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon name={h.icon} className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{h.title}</span>
                    <span className="block text-xs text-mute">{h.body}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
            <MobileJump label={content.mobileCta} />
          </div>
        </div>
      </div>
      <div className="mt-12 border-y border-hairline bg-card/40 py-3">
        <Marquee gap={40} durationSeconds={36}>
          {[...content.highlights, ...content.highlights].map((h, i) => (
            <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-mute">
              <Icon name={h.icon} className="size-4 text-accent" />
              {h.title}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/** Variant 4: tinted banner with drifting shapes, headline left and form card right. */
export function Hero4({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-accent/15 via-bg to-accent-2/10 pt-10 pb-16 lg:pt-16 lg:pb-24">
      <FloatingShapes />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal eager className="text-sm font-semibold">
              <GradientText>{content.badge || ctx.trustLine}</GradientText>
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[56px] lg:leading-[1.08]`} />
            <Reveal eager delay={200} as="p" className="mt-4 max-w-xl text-base text-mute sm:text-lg">
              {content.subheadline}
            </Reveal>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} index={i} className="rt-lift rounded-2xl bg-card/80 p-4 ring-1 ring-hairline backdrop-blur-sm">
                  <Icon name={h.icon} className="size-5 text-accent" />
                  <div className="mt-2 text-xs font-semibold text-ink">{h.title}</div>
                  <div className="mt-0.5 text-[11px] text-mute">{h.body}</div>
                </Reveal>
              ))}
            </div>
            <MobileJump label={content.mobileCta} />
          </div>
          <Parallax speed={0.06}>
            <div className="rounded-3xl p-1 shadow-2xl shadow-accent/20 ring-1 ring-accent/20">
              <HeroForm ctx={ctx} />
            </div>
          </Parallax>
        </div>
      </div>
    </section>
  );
}
