"use client";

import type { CSSProperties } from "react";
import type { SiteSettingsData } from "@/lib/defaults";
import { generatePartnerPage } from "@/lib/page-builder/generate";
import type { SectionKey } from "@/lib/page-builder/types";
import { AnimationProvider, useAnimationPreset } from "./motion";
import { resolvePage, type PagePlan, type PartnerView } from "./page-context";
import { getVariant } from "./registry";
import type { PageContext } from "./sections/types";

interface LandingPageProps {
  partner?: PartnerView | null;
  settings: SiteSettingsData;
  isCustomPartner?: boolean;
  /** The partner's saved page. Omitted for the root page, which renders the original design. */
  page?: PagePlan | null;
  /** Dev preview: renders the lead form as an inert placeholder. */
  preview?: boolean;
}

/** The original design: variant 1 and the original copy for every section. */
const ORIGINAL_PAGE: PagePlan = generatePartnerPage({}, { legacy: true, seed: 0 });

function Section<K extends SectionKey>({
  name,
  variantId,
  content,
  ctx,
}: {
  name: K;
  variantId: string;
  content: PageContentOf<K>;
  ctx: PageContext;
}) {
  const Variant = getVariant(name, variantId);
  return <Variant content={content} ctx={ctx} />;
}
type PageContentOf<K extends SectionKey> = ReturnType<typeof resolvePage>["content"][K];

function PageBody({ page, plan }: { page: ReturnType<typeof resolvePage>; plan: PagePlan }) {
  const preset = useAnimationPreset();
  const style = page.themeVars as CSSProperties;
  const { order, content, ctx } = page;
  const render = (k: SectionKey) => (
    <Section key={k} name={k} variantId={plan.layoutConfig[k]} content={content[k]} ctx={ctx} />
  );

  return (
    <div
      className="min-h-screen bg-bg text-ink transition-colors duration-300"
      style={style}
      data-btn={plan.themeConfig.buttonStyle}
      data-type={plan.themeConfig.typeStyle}
      data-anim={preset.style}
      data-lift={String(preset.hoverLift)}
    >
      {/* Background glow blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="f-blob a" />
        <div className="f-blob b" />
        <div className="f-blob c" />
      </div>

      {order.filter((k) => k === "navbar").map(render)}
      <main className="relative z-10">{order.filter((k) => k !== "navbar" && k !== "footer").map(render)}</main>
      {order.filter((k) => k === "footer").map(render)}
    </div>
  );
}

/** Renders a partner's saved page (or the original design) through the section registry. */
export function LandingPage({ partner, settings, isCustomPartner = false, page, preview = false }: LandingPageProps) {
  const plan = page ?? ORIGINAL_PAGE;
  const resolved = resolvePage({ partner, settings, isCustomPartner, plan, preview });
  return (
    <AnimationProvider style={plan.themeConfig.animationStyle}>
      <PageBody page={resolved} plan={plan} />
    </AnimationProvider>
  );
}
