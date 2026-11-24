"use client";

import { Icon } from "@/components/ui/icons";
import { Aurora, Beams, ChartLines, DotGrid, Noise, Orb, Particles, RetroGrid, Rings, Squares } from "../fx/backgrounds";
import { ShinyText, StarBorder, TiltCard } from "../fx/interactive";
import { AnimatedText } from "../motion/AnimatedText";
import { Marquee } from "../motion/Extras";
import { Reveal } from "../motion/Reveal";
import { H1, MobileJump } from "./hero";
import { HeroForm } from "./ui";
import type { SectionProps } from "./types";

type HeroProps = SectionProps<"hero">;

/** Badge whose text catches a sweep of light. */
function ShinyBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
      <span className="size-1.5 animate-pulse rounded-full bg-up" />
      <ShinyText>{text}</ShinyText>
    </div>
  );
}

function Sub({ text, className = "" }: { text: string; className?: string }) {
  return (
    <Reveal eager delay={200} as="p" className={`mt-4 text-base text-mute sm:text-lg ${className}`.trim()}>
      {text}
    </Reveal>
  );
}

/** Variant 5: centred copy over a soft aurora, the form on a comet border, highlights as a row beneath. */
export function Hero5({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
      <Aurora />
      <Noise />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <Reveal eager>
          <ShinyBadge text={content.badge || ctx.trustLine} />
        </Reveal>
        <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-6xl lg:leading-[1.06]`} />
        <Sub text={content.subheadline} className="mx-auto max-w-2xl" />
      </div>
      <div className="relative mx-auto mt-10 max-w-xl px-4 sm:px-6">
        <StarBorder>
          <HeroForm ctx={ctx} />
        </StarBorder>
      </div>
      <ul className="relative mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4">
        {content.highlights.map((h, i) => (
          <Reveal key={h.title} as="li" index={i} spot className="rounded-2xl border border-hairline bg-card/70 p-4 backdrop-blur-sm">
            <Icon name={h.icon} className="size-5 text-accent" />
            <div className="mt-2 text-xs font-semibold text-ink">{h.title}</div>
            <div className="mt-0.5 text-[11px] text-mute">{h.body}</div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

/** Variant 6: light beams, copy left with ruled highlights, the form tilting on a comet border. */
export function Hero6({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
      <Beams />
      <Noise />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal eager>
              <ShinyBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[56px] lg:leading-[1.08]`} />
            <Sub text={content.subheadline} className="max-w-2xl" />
            <ul className="mt-8 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} as="li" index={i} className="flex items-start gap-3 border-t border-hairline py-4">
                  <Icon name={h.icon} className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{h.title}</span>
                    <span className="block text-xs text-mute">{h.body}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
            <MobileJump label={content.mobileCta} />
          </div>
          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <TiltCard>
              <StarBorder>
                <HeroForm ctx={ctx} />
              </StarBorder>
            </TiltCard>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Variant 7: drifting particle network, form on the left, numbered highlights on the right. */
export function Hero7({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
      <Particles />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <TiltCard>
              <div className="rounded-3xl shadow-2xl shadow-accent/15">
                <HeroForm ctx={ctx} />
              </div>
            </TiltCard>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7">
            <Reveal eager>
              <ShinyBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[52px] lg:leading-[1.1]`} />
            <Sub text={content.subheadline} className="max-w-xl" />
            <ol className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} as="li" index={i} spot className="flex items-start gap-3 rounded-2xl border border-hairline bg-card/70 p-4 backdrop-blur-sm">
                  <span className="rt-outline-text text-2xl font-extrabold tabular-nums leading-none">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{h.title}</span>
                    <span className="block text-xs text-mute">{h.body}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
            <MobileJump label={content.mobileCta} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Variant 8: centred headline above a glowing retro grid floor, the form standing on the horizon. */
export function Hero8({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      <RetroGrid />
      <Aurora soft />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Reveal eager>
          <ShinyBadge text={content.badge || ctx.trustLine} />
        </Reveal>
        <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[64px] lg:leading-[1.05]`} />
        <Sub text={content.subheadline} className="mx-auto max-w-2xl" />
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {content.highlights.map((h, i) => (
            <Reveal key={h.title} as="li" index={i} eager delay={300} className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-ink backdrop-blur-sm">
              <Icon name={h.icon} className="size-3.5 text-accent" strokeWidth={2.5} />
              {h.title}
            </Reveal>
          ))}
        </ul>
      </div>
      <div className="relative mx-auto mt-10 max-w-xl px-4 sm:px-6">
        <div className="rounded-3xl shadow-2xl shadow-accent/30">
          <HeroForm ctx={ctx} />
        </div>
      </div>
    </section>
  );
}

/** Variant 9: a price-ticker tape on top of a drifting market chart, copy left and form right. */
export function Hero9({ content, ctx }: HeroProps) {
  const tape = [...content.highlights, ...content.highlights];
  return (
    <section className="relative overflow-hidden pb-16 lg:pb-24">
      <ChartLines />
      <div className="relative border-b border-hairline bg-card/50 py-2.5 backdrop-blur-sm">
        <Marquee gap={44} durationSeconds={40}>
          {tape.map((h, i) => (
            <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-mute">
              <span className="font-semibold text-ink">{h.title}</span>
              <span className="font-bold text-up" aria-hidden>
                ▲
              </span>
              <span>{h.body}</span>
            </span>
          ))}
        </Marquee>
      </div>
      <div className="relative mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:mt-14 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal eager>
              <ShinyBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[54px] lg:leading-[1.1]`} />
            <Sub text={content.subheadline} className="max-w-2xl" />
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} index={i} className="rt-lift flex items-center gap-3 rounded-2xl border border-hairline bg-card/75 p-3.5 backdrop-blur-sm">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon name={h.icon} className="size-4" strokeWidth={2.5} />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-ink">{h.title}</span>
                    <span className="block text-[11px] text-mute">{h.body}</span>
                  </span>
                </Reveal>
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

/** Variant 10: interactive dot grid that lights up under the cursor, spotlight highlight cards. */
export function Hero10({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
      <DotGrid />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal eager>
              <ShinyBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[56px] lg:leading-[1.08]`} />
            <Sub text={content.subheadline} className="max-w-2xl" />
            <div className="mt-8 grid grid-cols-2 gap-3">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} index={i} spot className="rounded-2xl border border-hairline bg-card/80 p-4 backdrop-blur-sm">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon name={h.icon} className="size-[18px]" />
                  </span>
                  <div className="mt-3 text-sm font-semibold text-ink">{h.title}</div>
                  <div className="mt-0.5 text-xs text-mute">{h.body}</div>
                </Reveal>
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

/** Variant 11: copy left, the form floating in front of a glowing orb with expanding rings. */
export function Hero11({ content, ctx }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
      <Rings size={1100} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal eager>
              <ShinyBadge text={content.badge || ctx.trustLine} />
            </Reveal>
            <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[56px] lg:leading-[1.08]`} />
            <Sub text={content.subheadline} className="max-w-xl" />
            <ul className="mt-7 space-y-3">
              {content.highlights.map((h, i) => (
                <Reveal key={h.title} as="li" index={i} className="flex items-center gap-3 text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-accent-ink">
                    <Icon name={h.icon} className="size-4" strokeWidth={2.5} />
                  </span>
                  <span>
                    <b className="font-semibold text-ink">{h.title}</b>
                    <span className="text-mute"> · {h.body}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
            <MobileJump label={content.mobileCta} />
          </div>
          <div className="relative">
            <Orb className="-right-8 -top-12 size-56 sm:size-72" />
            <Orb className="-bottom-10 -left-8 size-32 opacity-60 sm:size-40" />
            <div className="relative">
              <HeroForm ctx={ctx} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Variant 12: bento board over a quiet square grid: headline tile, wide first highlight, form tile. */
export function Hero12({ content, ctx }: HeroProps) {
  const [first, ...rest] = content.highlights;
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24">
      <Squares />
      <Noise />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="space-y-4 lg:col-span-7 lg:space-y-5">
            <div className="relative overflow-hidden rounded-3xl border border-hairline bg-card/80 p-6 shadow-sm backdrop-blur-sm sm:p-9">
              <Aurora soft fade="none" />
              <div className="relative">
                <Reveal eager>
                  <ShinyBadge text={content.badge || ctx.trustLine} />
                </Reveal>
                <AnimatedText as="h1" eager text={content.headline} className={`${H1} lg:text-[48px] lg:leading-[1.1]`} />
                <Sub text={content.subheadline} className="max-w-xl" />
              </div>
            </div>
            {first ? (
              <Reveal spot className="flex items-center gap-4 rounded-3xl border border-hairline bg-card/80 p-5 backdrop-blur-sm">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-accent-ink">
                  <Icon name={first.icon} className="size-6" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-ink">{first.title}</span>
                  <span className="block text-sm text-mute">{first.body}</span>
                </span>
              </Reveal>
            ) : null}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
              {rest.map((h, i) => (
                <Reveal key={h.title} index={i} spot className="rounded-3xl border border-hairline bg-card/80 p-5 backdrop-blur-sm">
                  <Icon name={h.icon} className="size-5 text-accent" />
                  <div className="mt-3 text-sm font-semibold text-ink">{h.title}</div>
                  <div className="mt-1 text-xs text-mute">{h.body}</div>
                </Reveal>
              ))}
            </div>
            <div className="lg:hidden">
              <MobileJump label={content.mobileCta} />
            </div>
          </div>
          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <StarBorder>
              <HeroForm ctx={ctx} />
            </StarBorder>
          </div>
        </div>
      </div>
    </section>
  );
}

