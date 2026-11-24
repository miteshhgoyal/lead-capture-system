"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { buildContent, LEGACY_SECTION_ORDER } from "@/lib/page-builder/generate";
import { CONTENT_POOLS } from "@/lib/page-builder/pools";
import { buildThemeVars, BUTTON_STYLES, LEGACY_THEME, PALETTES, RADII, TYPE_STYLES } from "@/lib/page-builder/theme";
import {
  ANIMATION_STYLES,
  BACKDROPS,
  SECTION_KEYS,
  SURFACES,
  variantIds,
  type AnimationStyle,
  type Backdrop,
  type ButtonStyle,
  type RadiusStyle,
  type SectionKey,
  type Surface,
  type TypeStyle,
} from "@/lib/page-builder/types";
import { PageBackdrop } from "../fx/PageBackdrop";
import { AnimationProvider, getAnimationPreset } from "../motion";
import { resolvePage, type PagePlan } from "../page-context";
import { RenderSection } from "../registry";

const SAMPLE_TESTIMONIALS = [
  { name: "Sample Learner 1", role: "Preview only", quote: "Sample testimonial text used only to preview this layout." },
  { name: "Sample Learner 2", role: "Preview only", quote: "Another placeholder quote so spacing and wrapping can be checked." },
  { name: "Sample Learner 3", quote: "Third placeholder quote. Real pages show the partner's own testimonials." },
];

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-semibold text-mute">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-hairline bg-bg px-2 py-1.5 text-xs font-medium text-ink"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Dev-only: every variant of every section with the same controls the page theme exposes. */
export function LayoutsPreview() {
  const [color, setColor] = useState("#3b36e0");
  const [animation, setAnimation] = useState<AnimationStyle>("soft-fade");
  const [radius, setRadius] = useState<RadiusStyle>("soft");
  const [button, setButton] = useState<ButtonStyle>("solid");
  const [type, setType] = useState<TypeStyle>("classic");
  const [palette, setPalette] = useState<string>(PALETTES[0].id);
  const [backdrop, setBackdrop] = useState<Backdrop>("blobs");
  const [surface, setSurface] = useState<Surface>("solid");
  const [contentIndex, setContentIndex] = useState(1);

  const maxContent = Math.max(...SECTION_KEYS.map((k) => CONTENT_POOLS[k].length));

  const { ctx, content, themeVars } = useMemo(() => {
    const plan: PagePlan = {
      layoutConfig: Object.fromEntries(SECTION_KEYS.map((k) => [k, `${k}_1`])) as PagePlan["layoutConfig"],
      contentConfig: buildContent((key) => Math.min(contentIndex - 1, CONTENT_POOLS[key].length - 1)),
      themeConfig: { ...LEGACY_THEME, paletteId: palette, radius, buttonStyle: button, typeStyle: type, animationStyle: animation, backdrop, surface },
      sectionOrder: [...LEGACY_SECTION_ORDER, "testimonials", "offer"],
    };
    return resolvePage({
      partner: { name: "Sample Partner", slug: "sample", theme: { primaryColor: color }, testimonials: SAMPLE_TESTIMONIALS },
      settings: DEFAULT_SETTINGS,
      isCustomPartner: true,
      plan,
      preview: true,
    });
  }, [color, animation, radius, button, type, palette, backdrop, surface, contentIndex]);

  const preset = getAnimationPreset(animation);

  return (
    <div className="min-h-screen bg-bg-alt text-ink">
      <div className="sticky top-0 z-50 border-b border-hairline bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end gap-4 px-4 py-3">
          <div>
            <h1 className="text-sm font-bold">/dev/layouts</h1>
            <p className="text-[11px] text-mute">Every section variant, development only</p>
          </div>
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-mute">
            Brand colour
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-7 w-14 cursor-pointer rounded border border-hairline" />
          </label>
          <Select label="Palette recipe" value={palette} options={PALETTES.map((p) => p.id)} onChange={setPalette} />
          <Select label="Radius" value={radius} options={RADII} onChange={setRadius} />
          <Select label="Buttons" value={button} options={BUTTON_STYLES} onChange={setButton} />
          <Select label="Type (Inter)" value={type} options={TYPE_STYLES} onChange={setType} />
          <Select label="Animation" value={animation} options={ANIMATION_STYLES} onChange={setAnimation} />
          <Select label="Backdrop" value={backdrop} options={BACKDROPS} onChange={setBackdrop} />
          <Select label="Card surface" value={surface} options={SURFACES} onChange={setSurface} />
          <label className="flex flex-col gap-1 text-[11px] font-semibold text-mute">
            Content set #{contentIndex}
            <input type="range" min={1} max={maxContent} value={contentIndex} onChange={(e) => setContentIndex(Number(e.target.value))} />
          </label>
        </div>
        <nav aria-label="Jump to section" className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-3 text-[11px] font-semibold">
          {SECTION_KEYS.map((k) => (
            <a key={k} href={`#preview-${k}`} className="rounded-full border border-hairline px-2.5 py-1 text-mute hover:text-ink">
              {k}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-10">
        {SECTION_KEYS.map((section: SectionKey) => (
          <section key={section} id={`preview-${section}`} className="scroll-mt-40">
            <h2 className="mb-4 text-lg font-bold capitalize">
              {section} <span className="text-sm font-medium text-mute">({variantIds(section).length} variants)</span>
            </h2>
            <div className="space-y-8">
              {variantIds(section).map((id) => (
                <figure key={id}>
                  <figcaption className="mb-2 flex items-center gap-3 text-xs font-semibold text-mute">
                    <code className="rounded bg-card px-2 py-0.5 text-ink">{id}</code>
                    <span>content: {CONTENT_POOLS[section][Math.min(contentIndex - 1, CONTENT_POOLS[section].length - 1)].id}</span>
                  </figcaption>
                  <div
                    className="relative isolate overflow-hidden rounded-2xl border border-hairline bg-bg"
                    style={themeVars as CSSProperties}
                    data-btn={button}
                    data-type={type}
                    data-anim={preset.style}
                    data-lift={String(preset.hoverLift)}
                    data-surface={surface}
                  >
                    <PageBackdrop kind={backdrop} fixed={false} />
                    <AnimationProvider style={animation}>
                      <div className="relative z-10">
                        <RenderSection name={section} variantId={id} content={content[section]} ctx={ctx} />
                      </div>
                    </AnimationProvider>
                  </div>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
