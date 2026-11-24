"use client";

import { Icon } from "@/components/ui/icons";
import type { FeatureVisual, IconKey, StatItem } from "@/lib/page-builder/types";
import { AreaChartVisual, CandlestickVisual, CountUp, RiskRewardVisual } from "../TradingVisuals";
import { initials } from "./ui";
import type { PageContext } from "./types";

/** Small pieces shared by the layout variants (kept out of the section files so chunks stay small). */

export function DisciplinePanel() {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-semibold text-mute">
        <span>Trader Discipline Score</span>
        <span className="font-bold text-up">94% Target Compliance</span>
      </div>
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs">
          <span className="text-mute">Zero Revenge Trades</span>
          <span className="font-semibold text-ink">100% Enforced</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 text-xs">
          <span className="text-mute">Max Daily Loss Cutoff</span>
          <span className="font-semibold text-ink">2% Total Capital</span>
        </div>
      </div>
    </div>
  );
}

export function FeatureVisualBlock({ visual }: { visual: FeatureVisual }) {
  if (visual === "area") return <AreaChartVisual />;
  if (visual === "risk") return <RiskRewardVisual />;
  if (visual === "candles") return <CandlestickVisual />;
  return <DisciplinePanel />;
}

/** Alternating tints so neighbouring icons read as a set rather than a rainbow. */
export function tone(i: number) {
  return i % 2 === 1 ? "bg-accent-2/15 text-accent" : "bg-accent/10 text-accent";
}

export function IconTile({ icon, index = 0, className = "size-11 rounded-xl", iconClass = "size-5" }: { icon: IconKey; index?: number; className?: string; iconClass?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${tone(index)} ${className}`}>
      <Icon name={icon} className={iconClass} />
    </span>
  );
}

/** Mentor / partner portrait: the uploaded logo, or initials on a brand gradient when there is none. */
export function MentorAvatar({ ctx, className = "size-24 rounded-2xl" }: { ctx: Pick<PageContext, "logoUrl" | "mentorName">; className?: string }) {
  if (ctx.logoUrl) {
    return (
      <span className={`flex items-center justify-center overflow-hidden border border-hairline bg-bg p-2.5 shadow-sm ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ctx.logoUrl} alt={ctx.mentorName} className="max-h-full max-w-full object-contain" />
      </span>
    );
  }
  return (
    <span className={`flex items-center justify-center bg-gradient-to-br from-accent to-accent-2 text-2xl font-bold text-accent-ink shadow-sm ${className}`} aria-label={ctx.mentorName}>
      {initials(ctx.mentorName) || "?"}
    </span>
  );
}

export function Avatar({ name, className = "size-10" }: { name: string; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent ${className}`} aria-hidden>
      {initials(name)}
    </span>
  );
}

export type Testimonial = PageContext["testimonials"][number];

export function Byline({ t, className = "" }: { t: Testimonial; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <Avatar name={t.name} />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
        {t.role ? <div className="truncate text-xs text-mute">{t.role}</div> : null}
      </div>
    </div>
  );
}

/** Repeats a short list until it has at least `min` entries (marquees look broken with one or two cards). */
export function fillTo<T>(items: T[], min: number): T[] {
  if (items.length === 0) return items;
  const out: T[] = [];
  while (out.length < Math.max(min, items.length)) out.push(...items);
  return out;
}

/** A stat as an animated counter (or plain text for values like "100%"). */
export function StatValue({ item }: { item: StatItem }) {
  if (item.end === undefined) return <>{item.text ?? ""}</>;
  return <CountUp end={item.end} decimals={item.decimals} suffix={item.suffix} />;
}

/** A stat as a static string (for tickers, where a counter would restart constantly). */
export function staticValue(item: StatItem): string {
  if (item.end === undefined) return item.text ?? "";
  const n = item.end.toLocaleString("en-US", { minimumFractionDigits: item.decimals ?? 0, maximumFractionDigits: item.decimals ?? 0 });
  return `${n}${item.suffix ?? ""}`;
}
