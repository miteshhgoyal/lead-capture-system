"use client";

import { ArrowRight, Lock } from "lucide-react";
import { Aurora, Beams, Orb, Particles, RetroGrid, Rings } from "../fx/backgrounds";
import { ShinyText, StarBorder } from "../fx/interactive";
import { AnimatedText } from "../motion/AnimatedText";
import { Reveal } from "../motion/Reveal";
import { Container, CtaButton, Eyebrow } from "./ui";
import type { SectionProps } from "./types";

type CtaProps = SectionProps<"cta">;

function Go({ children, className = "" }: { children: string; className?: string }) {
  return (
    <CtaButton className={className}>
      {children} <ArrowRight className="size-4" aria-hidden />
    </CtaButton>
  );
}

/** Variant 4: centred text on a soft aurora band. */
export function Cta4({ content, ctx }: CtaProps) {
  return (
    <section className="relative overflow-hidden py-20 text-center lg:py-28">
      <Aurora fade="y" />
      <Container size="md" className="relative">
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl" />
        <Reveal as="p" delay={120} className="mx-auto mt-4 max-w-xl text-sm text-mute sm:text-base">
          {content.body}
        </Reveal>
        <Go className="mt-8 px-8 py-4 text-base">{content.button}</Go>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-mute">
          <Lock className="size-3.5" aria-hidden /> {ctx.trustLine}
        </p>
      </Container>
    </section>
  );
}

/** Variant 5: a card lit by falling beams, circled by a comet. */
export function Cta5({ content }: CtaProps) {
  return (
    <section className="py-16 lg:py-24">
      <Container size="lg">
        <Reveal>
          <StarBorder>
            <div className="relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
              <Beams />
              <div className="relative mx-auto max-w-2xl">
                <Eyebrow>{content.eyebrow}</Eyebrow>
                <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-2xl font-bold tracking-tight text-ink sm:text-4xl" />
                <p className="mt-3 text-sm text-mute sm:text-base">{content.body}</p>
                <Go className="mt-8 px-8 py-4 text-base">{content.button}</Go>
              </div>
            </div>
          </StarBorder>
        </Reveal>
      </Container>
    </section>
  );
}

/** Variant 6: text on the left, the button standing on a glowing orb with rings on the right. */
export function Cta6({ content }: CtaProps) {
  return (
    <section className="py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <Reveal>
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl" />
            <p className="mt-3 max-w-md text-sm text-mute sm:text-base">{content.body}</p>
          </Reveal>
          <div className="relative flex min-h-[18rem] items-center justify-center">
            <Rings size={520} fade="none" />
            <Orb className="left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 sm:size-52" />
            <Go className="relative px-8 py-4 text-base shadow-2xl">{content.button}</Go>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Variant 7: centred text standing on a perspective grid floor. */
export function Cta7({ content }: CtaProps) {
  return (
    <section className="relative overflow-hidden pb-36 pt-16 text-center lg:pb-44 lg:pt-24">
      <RetroGrid />
      <Container size="md" className="relative">
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl" />
        <p className="mx-auto mt-4 max-w-xl text-sm text-mute sm:text-base">{content.body}</p>
        <Go className="mt-8 px-8 py-4 text-base">{content.button}</Go>
      </Container>
    </section>
  );
}

/** Variant 8: a slim banner. Headline on the left, the button on the right. */
export function Cta8({ content }: CtaProps) {
  return (
    <section className="py-12 lg:py-16">
      <Container size="lg">
        <Reveal className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-hairline bg-card p-6 shadow-lg sm:p-8 md:flex-row md:items-center">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest">
              <ShinyText>{content.eyebrow}</ShinyText>
            </span>
            <h2 className="rt-h mt-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">{content.title}</h2>
            <p className="mt-1.5 max-w-xl text-sm text-mute">{content.body}</p>
          </div>
          <Go className="w-full shrink-0 whitespace-nowrap px-7 py-3.5 text-sm md:w-auto">{content.button}</Go>
        </Reveal>
      </Container>
    </section>
  );
}

/** Variant 9: a gradient-bordered card with a drifting particle network. */
export function Cta9({ content }: CtaProps) {
  return (
    <section className="py-16 lg:py-24">
      <Container size="lg">
        <Reveal className="f-gborder relative overflow-hidden rounded-3xl p-8 text-center shadow-xl sm:p-14">
          <Particles fade="none" count={34} />
          <div className="relative mx-auto max-w-2xl">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-2xl font-bold tracking-tight text-ink sm:text-4xl" />
            <p className="mt-3 text-sm text-mute sm:text-base">{content.body}</p>
            <Go className="mt-8 px-8 py-4 text-base">{content.button}</Go>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
