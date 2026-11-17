"use client";

import type { StatItem } from "@/lib/page-builder/types";
import { Marquee } from "../motion/Extras";
import { Reveal } from "../motion/Reveal";
import { CountUp } from "../TradingVisuals";
import { Container, Section } from "./ui";
import type { SectionProps } from "./types";

type StatsProps = SectionProps<"stats">;

function StatValue({ item }: { item: StatItem }) {
  if (item.end === undefined) return <>{item.text ?? ""}</>;
  return <CountUp end={item.end} decimals={item.decimals} suffix={item.suffix} />;
}

function staticValue(item: StatItem): string {
  if (item.end === undefined) return item.text ?? "";
  const n = item.end.toLocaleString("en-US", { minimumFractionDigits: item.decimals ?? 0, maximumFractionDigits: item.decimals ?? 0 });
  return `${n}${item.suffix ?? ""}`;
}

/** Variant 1: the original four stat tiles. */
export function Stats1({ content }: StatsProps) {
  return (
    <Section id="stats" className="py-16">
      <Container>
        <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 md:gap-8">
          {content.items.map((item, i) => (
            <Reveal key={item.label} index={i} className="rt-lift rounded-2xl border border-hairline bg-card p-6 shadow-sm">
              <div className="text-2xl font-extrabold text-ink sm:text-4xl">
                <StatValue item={item} />
              </div>
              <div className="mt-1 text-xs font-medium text-mute sm:text-sm">{item.label}</div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 2: one brand-coloured band with dividers. */
export function Stats2({ content }: StatsProps) {
  return (
    <Section id="stats" className="py-16">
      <Container>
        <Reveal className="grid grid-cols-2 divide-accent-ink/15 overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-accent-2 text-center text-accent-ink shadow-xl shadow-accent/20 md:grid-cols-4 md:divide-x">
          {content.items.map((item) => (
            <div key={item.label} className="p-6 sm:p-8">
              <div className="text-3xl font-extrabold sm:text-4xl">
                <StatValue item={item} />
              </div>
              <div className="mt-1 text-xs font-medium opacity-85 sm:text-sm">{item.label}</div>
            </div>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 3: scrolling ticker of stat pills. */
export function Stats3({ content }: StatsProps) {
  return (
    <Section id="stats" className="py-10">
      <Marquee gap={20} durationSeconds={28}>
        {content.items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-3 whitespace-nowrap rounded-full border border-hairline bg-card px-6 py-3">
            <span className="text-xl font-extrabold text-accent">{staticValue(item)}</span>
            <span className="text-sm font-medium text-mute">{item.label}</span>
          </div>
        ))}
      </Marquee>
    </Section>
  );
}
