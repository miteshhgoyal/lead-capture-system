"use client";

import { useEffect, useState, useRef } from "react";

export function CountUp({
  end,
  duration = 2000,
  suffix = "",
  decimals = 0,
}: {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let startTimestamp: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setVal(ease * end);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref}>
      {val.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function AreaChartVisual() {
  const points = [
    { x: 0, y: 120 },
    { x: 50, y: 110 },
    { x: 100, y: 140 },
    { x: 150, y: 95 },
    { x: 200, y: 130 },
    { x: 250, y: 80 },
    { x: 300, y: 115 },
    { x: 350, y: 65 },
    { x: 400, y: 45 },
    { x: 450, y: 70 },
    { x: 500, y: 30 },
    { x: 550, y: 55 },
    { x: 600, y: 20 },
  ];

  const pathD = `M 0 120 ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L 600 180 L 0 180 Z`;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-hairline bg-card p-5">
      <div className="flex items-center justify-between pb-3">
        <div>
          <span className="text-xs font-semibold text-mute">Institutional Breakout Model</span>
          <div className="text-lg font-bold text-ink">Price Action Architecture</div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-up/10 px-2.5 py-1 text-xs font-semibold text-up">
          <span className="size-1.5 rounded-full bg-up animate-pulse" />
          +1:3.4 Risk-to-Reward
        </div>
      </div>

      <div className="relative h-44 w-full">
        <svg
          viewBox="0 0 600 180"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="45" x2="600" y2="45" stroke="var(--hairline)" strokeDasharray="4 4" />
          <line x1="0" y1="95" x2="600" y2="95" stroke="var(--hairline)" strokeDasharray="4 4" />
          <line x1="0" y1="145" x2="600" y2="145" stroke="var(--hairline)" strokeDasharray="4 4" />

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Curve stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Key trigger points */}
          <circle cx="250" cy="80" r="4.5" fill="var(--card)" stroke="var(--accent)" strokeWidth="3" />
          <circle cx="500" cy="30" r="4.5" fill="var(--card)" stroke="var(--up)" strokeWidth="3" />
          <circle cx="600" cy="20" r="5" fill="var(--up)" />
        </svg>

        {/* Callout markers */}
        <div className="absolute left-[38%] top-[30%] -translate-x-1/2 -translate-y-full rounded-md border border-hairline bg-bg px-2 py-0.5 text-[10px] font-semibold text-ink shadow-sm">
          Liquidity Sweep Entry
        </div>
        <div className="absolute right-4 top-2 rounded-md border border-up/30 bg-up/10 px-2 py-0.5 text-[10px] font-bold text-up shadow-sm">
          Take Profit Target Hit
        </div>
      </div>
    </div>
  );
}

export function CandlestickVisual() {
  const candles = [
    { o: 60, c: 45, h: 35, l: 70, bull: true },
    { o: 45, c: 55, h: 40, l: 65, bull: false },
    { o: 55, c: 50, h: 42, l: 62, bull: true },
    { o: 50, c: 35, h: 30, l: 58, bull: true },
    { o: 35, c: 42, h: 28, l: 48, bull: false },
    { o: 42, c: 22, h: 18, l: 46, bull: true },
    { o: 22, c: 15, h: 10, l: 26, bull: true },
  ];

  return (
    <div className="flex items-center justify-around gap-2 rounded-2xl border border-hairline bg-card p-4">
      {candles.map((c, i) => {
        const top = Math.min(c.o, c.c);
        const height = Math.max(Math.abs(c.o - c.c), 4);
        return (
          <div key={i} className="flex flex-col items-center">
            {/* Upper wick */}
            <div
              className={`w-0.5 ${c.bull ? "bg-up" : "bg-down"}`}
              style={{ height: `${top - c.h}px` }}
            />
            {/* Candle Body */}
            <div
              className={`w-3.5 rounded-sm sm:w-5 ${c.bull ? "bg-up" : "bg-down"}`}
              style={{ height: `${height}px` }}
            />
            {/* Lower wick */}
            <div
              className={`w-0.5 ${c.bull ? "bg-up" : "bg-down"}`}
              style={{ height: `${c.l - (top + height)}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function RiskRewardVisual() {
  return (
    <div className="rounded-2xl border border-hairline bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-mute">Disciplined Sizing</span>
        <span className="text-xs font-bold text-up">1 : 3 R/R Guaranteed Model</span>
      </div>
      <div className="mt-3 flex h-6 w-full overflow-hidden rounded-xl bg-bg-alt p-1">
        <div className="flex w-1/4 items-center justify-center rounded-lg bg-down/20 text-[10px] font-bold text-down">
          1x Risk
        </div>
        <div className="ml-1 flex w-3/4 items-center justify-center rounded-lg bg-up/20 text-[10px] font-bold text-up">
          3x Target Return
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-mute">
        <span>Stop Loss: Max 1% Equity</span>
        <span>Target: 3% - 5% Profit</span>
      </div>
    </div>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 28;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24 shrink-0 overflow-visible">
      <polyline
        fill="none"
        stroke="var(--up)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
