"use client";

import { Reveal } from "../motion/Reveal";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type StepsProps = SectionProps<"steps">;

/** Variant 1: the original three numbered cards. */
export function Steps1({ content }: StepsProps) {
  return (
    <Section id="how" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {content.items.map((step, i) => (
            <Reveal key={step.title} index={i} className="rt-lift relative rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-ink">{i + 1}</div>
              <h3 className="rt-h mt-5 text-lg font-bold text-ink sm:text-xl">{step.title}</h3>
              <p className="mt-2 text-sm text-mute">{step.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 2: vertical timeline. */
export function Steps2({ content }: StepsProps) {
  return (
    <Section id="how" className="bg-bg-alt/40 py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="relative mt-12 space-y-10 border-l-2 border-accent/25 pl-8 sm:pl-10">
          {content.items.map((step, i) => (
            <Reveal key={step.title} as="li" index={i} className="relative">
              <span className="absolute -left-[2.9rem] top-0 flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink ring-4 ring-bg sm:-left-[3.4rem]">
                {i + 1}
              </span>
              <h3 className="rt-h text-lg font-bold text-ink sm:text-xl">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mute sm:text-base">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/** Variant 3: horizontal stepper joined by a connector line. */
export function Steps3({ content }: StepsProps) {
  return (
    <Section id="how" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
          <span aria-hidden className="absolute left-[16.7%] right-[16.7%] top-7 hidden h-0.5 bg-gradient-to-r from-accent/60 via-accent/30 to-accent/60 md:block" />
          {content.items.map((step, i) => (
            <Reveal key={step.title} as="li" index={i} className="relative text-center">
              <span className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-ink shadow-lg shadow-accent/25 ring-8 ring-bg">
                {i + 1}
              </span>
              <h3 className="rt-h mt-5 text-lg font-bold text-ink">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-mute">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
