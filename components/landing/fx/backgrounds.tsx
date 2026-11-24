"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { usePrefersReducedMotion } from "../motion/hooks";

/**
 * Background effects for hero sections and bands (React Bits-style Aurora, Beams, Squares, DotGrid,
 * Retro Grid, Particles, Orb ...). Everything here is dependency-free, decorative (aria-hidden,
 * pointer-events none), deterministic on the server and driven only by the page's own colour tokens.
 * Pass `fade` so the effect melts into the neighbouring section instead of ending on a hard edge.
 */
export type FxFade = "b" | "t" | "y" | "none";

type CssVar = CSSProperties & Record<`--${string}`, string | number | undefined>;

interface FxProps {
  className?: string;
  fade?: FxFade;
}

/** Shared absolutely-positioned, click-through wrapper. */
export function FxLayer({ fade = "none", className = "", fixed = false, children }: FxProps & { fixed?: boolean; children?: ReactNode }) {
  return (
    <div aria-hidden="true" data-fade={fade === "none" ? undefined : fade} className={`rt-fx ${fixed ? "rt-fx-fixed" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

/** Three slow blurred colour fields in the brand colours. */
export function Aurora({ className = "", fade = "b", soft = false }: FxProps & { soft?: boolean }) {
  return (
    <FxLayer fade={fade} className={className}>
      <div className="rt-aurora" data-soft={String(soft)}>
        <i />
        <i />
        <i />
      </div>
    </FxLayer>
  );
}

const BEAMS: { x: string; r: number; w: number; dur: number; dl: number; bl: number }[] = [
  { x: "6%", r: 16, w: 2, dur: 9, dl: -2, bl: 0.5 },
  { x: "20%", r: -12, w: 3, dur: 12, dl: -7, bl: 2 },
  { x: "34%", r: 20, w: 1.5, dur: 8, dl: -4, bl: 0.4 },
  { x: "49%", r: -6, w: 4, dur: 14, dl: -9, bl: 5 },
  { x: "63%", r: 14, w: 2, dur: 10, dl: -1, bl: 0.6 },
  { x: "78%", r: -18, w: 3, dur: 11, dl: -6, bl: 2 },
  { x: "92%", r: 10, w: 1.5, dur: 9, dl: -3, bl: 0.5 },
];

/** Slow light beams raining from the top edge. */
export function Beams({ className = "", fade = "b" }: FxProps) {
  return (
    <FxLayer fade={fade} className={`rt-beams ${className}`.trim()}>
      {BEAMS.map((b, i) => (
        <b key={i} style={{ "--x": b.x, "--r": `${b.r}deg`, "--w": `${b.w}px`, "--dur": `${b.dur}s`, "--dl": `${b.dl}s`, "--bl": `${b.bl}px` } as CssVar} />
      ))}
    </FxLayer>
  );
}

/**
 * Dot matrix. With `interactive` the dots near the pointer light up in the accent colour
 * (the pointer is tracked on the parent section, so it works even though the layer is click-through).
 */
export function DotGrid({ className = "", fade = "b", interactive = true }: FxProps & { interactive?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || !interactive || reduced) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    host.addEventListener("pointermove", move);
    return () => host.removeEventListener("pointermove", move);
  }, [interactive, reduced]);
  return (
    <FxLayer fade={fade} className={className}>
      <div ref={ref} className="absolute inset-0">
        <div className="rt-dots" />
        {interactive ? <div className="rt-dots-hot" /> : null}
      </div>
    </FxLayer>
  );
}

const CELLS: [number, number, number][] = [
  [2, 1, 0], [5, 3, -2], [8, 0, -4], [11, 2, -1], [14, 4, -3], [17, 1, -5], [20, 3, -2.5], [3, 5, -4.5], [9, 6, -1.5], [15, 6, -3.5], [23, 2, -0.5], [26, 5, -5.5],
];

/** A square grid in which a few cells slowly light up. */
export function Squares({ className = "", fade = "b" }: FxProps) {
  return (
    <FxLayer fade={fade} className={className}>
      <div className="rt-squares">
        {CELLS.map(([c, r, dl], i) => (
          <i key={i} style={{ "--c": c, "--r": r, "--dl": `${dl}s` } as CssVar} />
        ))}
      </div>
    </FxLayer>
  );
}

/** Perspective grid floor running to a glowing horizon. Best at the bottom of a section. */
export function RetroGrid({ className = "", fade = "t" }: FxProps) {
  return (
    <FxLayer fade={fade} className={className}>
      <div className="rt-retro">
        <div className="rt-retro-plane" />
      </div>
    </FxLayer>
  );
}

/* Market chart: a periodic line + candles so the track can loop seamlessly. */
const CW = 1200;
const CH = 400;
const lineY = (x: number, phase = 0) =>
  200 - (46 * Math.sin(((2 * Math.PI * 2 * x) / CW) + phase) + 24 * Math.sin(((2 * Math.PI * 5 * x) / CW) + 1.3 + phase) + 10 * Math.sin(((2 * Math.PI * 11 * x) / CW) + 0.4));
const r1 = (n: number) => Math.round(n * 10) / 10;
const linePath = (phase: number, dy: number) => {
  const pts: string[] = [];
  for (let x = 0; x <= CW; x += 12) pts.push(`${x === 0 ? "M" : "L"}${x} ${r1(lineY(x, phase) + dy)}`);
  return pts.join(" ");
};
const MAIN_LINE = linePath(0, 0);
const SIDE_LINE = linePath(1.9, 70);
const CANDLES = Array.from({ length: 40 }, (_, i) => {
  const x = i * 30 + 15;
  const hash = (i * 2654435761) >>> 0;
  const body = 12 + (hash % 34);
  const wick = body + 8 + ((hash >>> 8) % 18);
  const up = hash % 3 !== 0;
  const mid = lineY(x) + 28 * (((hash >>> 4) % 100) / 100 - 0.5);
  return { x, up, body: r1(body), wick: r1(wick), y: r1(mid) };
});

function ChartTile() {
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="rt-cl-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {CANDLES.map((c) => (
        <g key={c.x} opacity="0.3">
          <line x1={c.x} x2={c.x} y1={c.y - c.wick / 2} y2={c.y + c.wick / 2} stroke={c.up ? "var(--up)" : "var(--down)"} strokeWidth="1.5" />
          <rect x={c.x - 5} y={c.y - c.body / 2} width="10" height={c.body} rx="1.5" fill={c.up ? "var(--up)" : "var(--down)"} />
        </g>
      ))}
      <path d={`${MAIN_LINE} L${CW} ${CH} L0 ${CH} Z`} fill="url(#rt-cl-g)" />
      <path d={SIDE_LINE} fill="none" stroke="var(--accent-2)" strokeOpacity="0.45" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={MAIN_LINE} fill="none" stroke="var(--accent)" strokeOpacity="0.85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A price chart with candles that drifts sideways forever: the on-theme hero background. */
export function ChartLines({ className = "", fade = "b" }: FxProps) {
  return (
    <FxLayer fade={fade} className={className}>
      <div className="rt-chart" style={{ opacity: 0.7 }}>
        <div className="rt-chart-track">
          <ChartTile />
          <ChartTile />
        </div>
      </div>
    </FxLayer>
  );
}

/** A glowing sphere. Size and position come from `className` (e.g. "left-1/2 top-10 size-72 -translate-x-1/2"). */
export function Orb({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`rt-orb ${className}`.trim()} />;
}

/** Concentric rings expanding from the centre. */
export function Rings({ className = "", fade = "y", size = 900 }: FxProps & { size?: number }) {
  return (
    <FxLayer fade={fade} className={`rt-rings ${className}`.trim()}>
      {[0, 1, 2, 3, 4].map((k) => (
        <i key={k} style={{ "--k": k, "--s": `${size}px` } as CssVar} />
      ))}
    </FxLayer>
  );
}

/** Film grain overlay. */
export function Noise({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rt-noise ${className}`.trim()} />;
}

/** Static multi-colour mesh gradient (no animation). */
export function Mesh({ className = "", fade = "b" }: FxProps) {
  return (
    <FxLayer fade={fade} className={className}>
      <div className="rt-mesh" />
    </FxLayer>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: 0 | 1;
}

/**
 * Drifting points joined by faint lines when they come close (a "network" look).
 * Canvas, capped at 2x DPR, paused while off-screen or in a hidden tab, drawn once for reduced motion.
 */
export function Particles({ count = 46, link = 120, className = "", fade = "b" }: FxProps & { count?: number; link?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const host = canvas.parentElement ?? canvas;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const n = window.innerWidth < 640 ? Math.round(count * 0.55) : count;
    const ps: Particle[] = Array.from({ length: n }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.018,
      vy: (Math.random() - 0.5) * 0.018,
      r: 1 + Math.random() * 1.6,
      hue: Math.random() < 0.7 ? 0 : 1,
    }));
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = 0;
    let frame = 0;
    let visible = true;
    let c1 = "#6366f1";
    let c2 = "#8b5cf6";

    const readColours = () => {
      const s = getComputedStyle(canvas);
      c1 = s.getPropertyValue("--accent").trim() || c1;
      c2 = s.getPropertyValue("--accent-2").trim() || c1;
    };
    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i];
        for (let j = i + 1; j < ps.length; j++) {
          const b = ps[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const d = Math.hypot(dx, dy);
          if (d < link) {
            ctx.globalAlpha = (1 - d / link) * 0.28;
            ctx.strokeStyle = c1;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }
      for (const p of ps) {
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = p.hue ? c2 : c1;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const step = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((t - last) / 1000, 0.05) || 0;
      last = t;
      if (frame++ % 120 === 0) readColours();
      for (const p of ps) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -0.02) p.x = 1.02;
        else if (p.x > 1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        else if (p.y > 1.02) p.y = -0.02;
      }
      draw();
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      if (!raf && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(step);
      }
    };

    readColours();
    resize();
    draw();
    const ro = new ResizeObserver(() => {
      resize();
      draw();
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    const onVis = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [count, link, reduced]);

  return (
    <FxLayer fade={fade} className={className}>
      <canvas ref={ref} className="absolute inset-0 size-full" />
    </FxLayer>
  );
}
