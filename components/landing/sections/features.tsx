"use client";

import { Icon } from "@/components/ui/icons";
import type { FeatureItem } from "@/lib/page-builder/types";
import { Reveal } from "../motion/Reveal";
import { FeatureVisualBlock } from "./kit";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type FeaturesProps = SectionProps<"features">;

function tone(i: number) {
  return i % 2 === 1 ? "bg-accent-2/15 text-accent" : "bg-accent/10 text-accent";
}

function IconTile({ item, index, className = "size-12 rounded-2xl" }: { item: FeatureItem; index: number; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center ${tone(index)} ${className}`}>
      <Icon name={item.icon} className="size-6" />
    </div>
  );
}

/** Variant 1: the original 2-column pillar cards, each with its illustration. */
export function Features1({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="rt-tint py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {content.items.map((item, i) => (
            <Reveal
              key={item.title}
              index={i % 2}
              className="rt-lift flex min-w-0 flex-col justify-between rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-8"
            >
              <div>
                <IconTile item={item} index={i} />
                <h3 className="rt-h mt-4 text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-mute">{item.body}</p>
              </div>
              {item.visual ? (
                <div className="mt-6">
                  <FeatureVisualBlock visual={item.visual} />
                </div>
              ) : null}
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 2: compact four-up grid. */
export function Features2({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <Reveal key={item.title} index={i} className="rt-lift rounded-3xl border border-hairline bg-card p-6 shadow-sm">
              <IconTile item={item} index={i} className="size-11 rounded-xl" />
              <h3 className="rt-h mt-4 text-base font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 3: sticky heading on the left, numbered rows on the right. */
export function Features3({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="rt-tint py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            </div>
          </div>
          <ol className="divide-y divide-hairline lg:col-span-7">
            {content.items.map((item, i) => (
              <Reveal key={item.title} as="li" index={i} className="flex gap-4 py-6 first:pt-0 sm:gap-5">
                <span className="w-8 shrink-0 text-2xl font-bold tabular-nums text-accent/40">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h3 className="rt-h flex items-center gap-2 text-lg font-bold text-ink">
                    <Icon name={item.icon} className="size-5 shrink-0 text-accent" />
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mute">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 4: alternating rows, each pairing the copy with a visual or an icon panel. */
export function Features4({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-14 space-y-12 lg:space-y-16">
          {content.items.map((item, i) => (
            <Reveal key={item.title} className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div>
                <IconTile item={item} index={i} className="size-11 rounded-xl" />
                <h3 className="rt-h mt-4 text-2xl font-bold tracking-tight text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{item.body}</p>
              </div>
              <div className="min-w-0 rounded-3xl border border-hairline bg-card p-4 shadow-sm sm:p-5">
                {item.visual ? (
                  <FeatureVisualBlock visual={item.visual} />
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 via-card to-accent-2/15 text-accent">
                    <Icon name={item.icon} className="size-14" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
