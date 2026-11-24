"use client";

import { ArrowRight, Lock } from "lucide-react";
import { FloatingShapes } from "../motion/Extras";
import { Reveal } from "../motion/Reveal";
import { AnimatedText } from "../motion/AnimatedText";
import { Container, CtaButton, Eyebrow, scrollToForm } from "./ui";
import type { SectionProps } from "./types";

type CtaProps = SectionProps<"cta">;

/** Variant 1: the original gradient card. */
export function Cta1({ content }: CtaProps) {
  return (
    <section className="py-16 lg:py-20">
      <Container size="lg">
        <Reveal className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-8 text-center shadow-xl sm:p-12">
          <div className="relative z-10 mx-auto max-w-2xl">
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">{content.eyebrow}</span>
            <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-2xl font-bold tracking-tight text-ink sm:text-4xl" />
            <p className="mt-3 text-sm text-mute sm:text-base">{content.body}</p>
            <div className="mt-8 flex justify-center">
              <CtaButton className="px-8 py-4 text-base">
                {content.button} <ArrowRight className="size-4" aria-hidden />
              </CtaButton>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/** Variant 2: full-bleed brand band with an inverted button. */
export function Cta2({ content }: CtaProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-accent to-accent-2 py-16 text-center text-accent-ink lg:py-24">
      <FloatingShapes />
      <Container size="md" className="relative">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{content.eyebrow}</span>
        <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-3xl font-bold tracking-tight sm:text-5xl" />
        <Reveal as="p" delay={120} className="mx-auto mt-4 max-w-xl text-sm opacity-90 sm:text-base">
          {content.body}
        </Reveal>
        <button
          type="button"
          onClick={scrollToForm}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-neutral-900 shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
        >
          {content.button} <ArrowRight className="size-4" aria-hidden />
        </button>
      </Container>
    </section>
  );
}

/** Variant 3: split card with the button on the right and a trust note beneath it. */
export function Cta3({ content, ctx }: CtaProps) {
  return (
    <section className="py-16 lg:py-20">
      <Container size="lg">
        <Reveal className="grid items-center gap-8 rounded-3xl border border-hairline bg-card p-8 shadow-lg md:grid-cols-5 md:p-12">
          <div className="md:col-span-3">
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <AnimatedText as="h2" text={content.title} className="rt-h mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl" />
            <p className="mt-3 text-sm text-mute sm:text-base">{content.body}</p>
          </div>
          <div className="md:col-span-2 md:text-center">
            <CtaButton className="w-full px-6 py-4 text-base">
              {content.button} <ArrowRight className="size-4" aria-hidden />
            </CtaButton>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-mute md:justify-center">
              <Lock className="size-3.5" aria-hidden /> {ctx.trustLine}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
