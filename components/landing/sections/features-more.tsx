"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Icon } from "@/components/ui/icons";
import { Aurora, Squares } from "../fx/backgrounds";
import { TiltCard } from "../fx/interactive";
import { Marquee } from "../motion/Extras";
import { Reveal } from "../motion/Reveal";
import { AreaChartVisual } from "../TradingVisuals";
import { FeatureVisualBlock, IconTile, fillTo, tone } from "./kit";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type FeaturesProps = SectionProps<"features">;

/** Variant 5: bento board. The first and last pillars are wide, the middle two are narrow. */
export function Features5({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {content.items.map((item, i) => {
            const wide = i % 4 === 0 || i % 4 === 3;
            return (
              <Reveal
                key={item.title}
                index={i % 3}
                spot
                className={`flex min-w-0 flex-col justify-between gap-6 rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8 ${wide ? "lg:col-span-2" : ""}`}
              >
                <div>
                  <IconTile icon={item.icon} index={i} className="size-12 rounded-2xl" iconClass="size-6" />
                  <h3 className="rt-h mt-4 text-xl font-bold text-ink sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">{item.body}</p>
                </div>
                {item.visual && wide ? <FeatureVisualBlock visual={item.visual} /> : null}
              </Reveal>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 6: tabs. Pick a pillar on the left, read it (and see its visual) on the right. */
export function Features6({ content }: FeaturesProps) {
  const [active, setActive] = useState(0);
  const item = content.items[active] ?? content.items[0];
  return (
    <Section id="learn" className="rt-tint py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div role="tablist" aria-label={content.title} className="rt-scrollbar-none flex gap-2 overflow-x-auto lg:col-span-4 lg:flex-col lg:overflow-visible">
            {content.items.map((it, i) => (
              <button
                key={it.title}
                type="button"
                role="tab"
                id={`feat-tab-${i}`}
                aria-selected={i === active}
                aria-controls="feat-panel"
                onClick={() => setActive(i)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition ${
                  i === active ? "border-accent/40 bg-accent/10 text-ink shadow-sm" : "border-hairline bg-card text-mute hover:text-ink"
                }`}
              >
                <IconTile icon={it.icon} index={i} className="size-9 rounded-xl" iconClass="size-4" />
                <span>{it.title}</span>
              </button>
            ))}
          </div>
          <div id="feat-panel" role="tabpanel" aria-labelledby={`feat-tab-${active}`} className="min-w-0 rounded-3xl border border-hairline bg-card p-5 shadow-sm sm:p-8 lg:col-span-8">
            <h3 className="rt-h text-2xl font-bold tracking-tight text-ink">{item.title}</h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-mute sm:text-base">{item.body}</p>
            <div className="mt-6">
              {item.visual ? (
                <FeatureVisualBlock visual={item.visual} />
              ) : (
                <div className="flex aspect-[16/8] items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 via-card to-accent-2/15 text-accent">
                  <Icon name={item.icon} className="size-14" strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 7: tall numbered cards over a quiet square grid. */
export function Features7({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="relative py-16 lg:py-24">
      <Squares fade="y" />
      <Container className="relative">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <Reveal key={item.title} index={i} className="rt-lift relative flex flex-col overflow-hidden rounded-3xl border border-hairline bg-card p-6 shadow-sm lg:min-h-[17rem]">
              <span aria-hidden className="rt-outline-text pointer-events-none absolute -right-1 -top-3 text-7xl font-extrabold tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 text-accent-ink shadow-lg shadow-accent/25">
                <Icon name={item.icon} className="size-6" />
              </span>
              <h3 className="rt-h relative mt-auto pt-10 text-lg font-bold text-ink">{item.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-mute">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 8: the pillars as a slow, endless ribbon of cards. */
export function Features8({ content }: FeaturesProps) {
  const cards = fillTo(content.items, 4);
  return (
    <Section id="learn" className="rt-tint py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
      </Container>
      <div className="mt-12">
        <Marquee gap={20} durationSeconds={52}>
          {cards.map((item, i) => (
            <div key={i} className="w-[18rem] shrink-0 rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:w-[21rem]">
              <IconTile icon={item.icon} index={i} className="size-11 rounded-xl" />
              <h3 className="rt-h mt-4 text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{item.body}</p>
            </div>
          ))}
        </Marquee>
      </div>
    </Section>
  );
}

/** Variant 9: cards that stack on top of each other as you scroll (desktop), plain list on mobile. */
export function Features9({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="mt-12 space-y-6 md:space-y-8">
          {content.items.map((item, i) => (
            <li key={item.title} className="md:sticky" style={{ top: `${5.5 + i * 1.1}rem` }}>
              <div data-solid className="grid grid-cols-1 items-center gap-6 rounded-3xl border border-hairline bg-card p-6 shadow-lg sm:p-8 md:grid-cols-2 md:gap-10">
                <div>
                  <div className="flex items-center gap-3">
                    <IconTile icon={item.icon} index={i} className="size-11 rounded-xl" />
                    <span className="text-sm font-bold tabular-nums text-accent/60">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="rt-h mt-4 text-2xl font-bold tracking-tight text-ink">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{item.body}</p>
                </div>
                <div className="min-w-0">
                  {item.visual ? (
                    <FeatureVisualBlock visual={item.visual} />
                  ) : (
                    <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-gradient-to-br from-accent/15 via-card to-accent-2/15 text-accent">
                      <Icon name={item.icon} className="size-14" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/** Variant 10: one big chart on the left, the pillars as a checked list on the right. */
export function Features10({ content }: FeaturesProps) {
  const lead = content.items.find((it) => it.visual);
  return (
    <Section id="learn" className="rt-tint py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className="min-w-0 rounded-3xl border border-hairline bg-card p-4 shadow-lg sm:p-6 lg:col-span-6">
            {lead?.visual ? <FeatureVisualBlock visual={lead.visual} /> : <AreaChartVisual />}
          </Reveal>
          <div className="lg:col-span-6">
            <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <ul className="mt-8 space-y-5">
              {content.items.map((item, i) => (
                <Reveal key={item.title} as="li" index={i} className="flex gap-4">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <span className="rt-h block text-base font-bold text-ink">{item.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-mute">{item.body}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 11: editorial rows, giant numerals and a hover highlight. */
export function Features11({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="py-16 lg:py-24">
      <Container>
        <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <ol className="mt-12 border-t border-hairline">
          {content.items.map((item, i) => (
            <Reveal key={item.title} as="li" index={i} className="group border-b border-hairline transition-colors hover:bg-accent/5">
              <div className="grid grid-cols-12 items-center gap-x-4 gap-y-2 px-2 py-7 sm:px-4 lg:py-9">
                <span className="rt-outline-text col-span-3 text-5xl font-extrabold tabular-nums sm:col-span-2 lg:text-7xl">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="rt-h col-span-9 text-xl font-bold text-ink sm:col-span-4 lg:text-2xl">{item.title}</h3>
                <p className="col-span-12 text-sm leading-relaxed text-mute sm:col-span-5 sm:pl-0">{item.body}</p>
                <span className="col-span-1 hidden justify-end text-accent opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                  <ArrowUpRight className="size-6" aria-hidden />
                </span>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

/** Variant 12: frosted tilting cards with glowing icons, floating on an aurora band. */
export function Features12({ content }: FeaturesProps) {
  return (
    <Section id="learn" className="relative py-16 lg:py-24">
      <Aurora soft fade="y" />
      <Container className="relative">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((item, i) => (
            <TiltCard key={item.title}>
              <Reveal index={i} spot className="h-full rounded-3xl border border-hairline bg-card/80 p-6 text-center shadow-sm backdrop-blur-sm">
                <span className={`mx-auto flex size-14 items-center justify-center rounded-full shadow-lg shadow-accent/25 ${tone(i)}`}>
                  <Icon name={item.icon} className="size-6" />
                </span>
                <h3 className="rt-h mt-5 text-base font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{item.body}</p>
              </Reveal>
            </TiltCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}
