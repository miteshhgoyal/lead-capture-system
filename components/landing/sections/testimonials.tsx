"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import { Container, Section, SectionHeader, initials } from "./ui";
import type { PageContext, SectionProps } from "./types";

type TestimonialsProps = SectionProps<"testimonials">;
type Item = PageContext["testimonials"][number];

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent" aria-hidden>
      {initials(name)}
    </span>
  );
}

function Byline({ t }: { t: Item }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={t.name} />
      <div>
        <div className="text-sm font-semibold text-ink">{t.name}</div>
        {t.role ? <div className="text-xs text-mute">{t.role}</div> : null}
      </div>
    </div>
  );
}

/** Variant 1: card grid. */
export function Testimonials1({ content, ctx }: TestimonialsProps) {
  return (
    <Section id="reviews" className="bg-bg-alt/40 py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ctx.testimonials.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} index={i % 3} as="figure" className="rt-lift flex flex-col justify-between rounded-3xl border border-hairline bg-card p-6 shadow-sm">
              <blockquote>
                <Quote className="size-6 text-accent/40" aria-hidden />
                <p className="mt-3 text-sm leading-relaxed text-ink">{t.quote}</p>
              </blockquote>
              <figcaption className="mt-6">
                <Byline t={t} />
              </figcaption>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 2: scroll-snap carousel with previous / next controls. */
export function Testimonials2({ content, ctx }: TestimonialsProps) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <Section id="reviews" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="relative mt-12">
          <div
            ref={track}
            tabIndex={0}
            aria-label="Learner feedback"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {ctx.testimonials.map((t, i) => (
              <figure key={`${t.name}-${i}`} className="w-[88%] shrink-0 snap-center rounded-3xl border border-hairline bg-card p-7 shadow-sm sm:w-[60%] lg:w-[42%]">
                <Quote className="size-7 text-accent/40" aria-hidden />
                <blockquote className="mt-3 text-base leading-relaxed text-ink sm:text-lg">{t.quote}</blockquote>
                <figcaption className="mt-6">
                  <Byline t={t} />
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button type="button" onClick={() => scroll(-1)} aria-label="Previous testimonial" className="rounded-full border border-hairline bg-card p-2.5 text-ink transition hover:bg-bg-alt">
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Next testimonial" className="rounded-full border border-hairline bg-card p-2.5 text-ink transition hover:bg-bg-alt">
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 3: heading on the left, quotes stacked with an accent rule on the right. */
export function Testimonials3({ content, ctx }: TestimonialsProps) {
  return (
    <Section id="reviews" className="bg-bg-alt/30 py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </div>
          <div className="space-y-5 lg:col-span-8">
            {ctx.testimonials.map((t, i) => (
              <Reveal key={`${t.name}-${i}`} index={i} as="figure" className="rounded-r-3xl border-l-4 border-accent bg-card p-6 shadow-sm">
                <blockquote className="text-base leading-relaxed text-ink">{t.quote}</blockquote>
                <figcaption className="mt-4">
                  <Byline t={t} />
                </figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
