"use client";

import type { CSSProperties } from "react";
import type { SiteSettingsData } from "@/lib/defaults";
import { generatePartnerPage } from "@/lib/page-builder/generate";
import type { SectionKey } from "@/lib/page-builder/types";
import { AnimationProvider, useAnimationPreset } from "./motion";
import { resolvePage, type PagePlan, type PartnerView } from "./page-context";
import { PageBackdrop } from "./fx/PageBackdrop";
import { RenderSection } from "./registry";

interface LandingPageProps {
  partner?: PartnerView | null;
  settings: SiteSettingsData;
  isCustomPartner?: boolean;
  /** The partner's saved page. Omitted for the root page, which renders the original design. */
  page?: PagePlan | null;
  /** Dev preview: renders the lead form as an inert placeholder. */
  preview?: boolean;
  /** `partner` swaps the hero's lead form for the partner sign-up form (the `/` page). */
  formMode?: "lead" | "partner";
}

/** The original design: variant 1 and the original copy for every section. */
const ORIGINAL_PAGE: PagePlan = generatePartnerPage({}, { legacy: true, seed: 0 });

function PageBody({ page, plan, formMode }: { page: ReturnType<typeof resolvePage>; plan: PagePlan; formMode: "lead" | "partner" }) {
  const preset = useAnimationPreset();
  const style = page.themeVars as CSSProperties;
  const { order, content, ctx } = page;
  const render = (k: SectionKey) => (
    <RenderSection key={k} name={k} variantId={plan.layoutConfig[k]} content={content[k]} ctx={ctx} />
  );

  return (
    <div
      className="min-h-screen bg-bg text-ink transition-colors duration-300"
      style={style}
      data-btn={plan.themeConfig.buttonStyle}
      data-type={plan.themeConfig.typeStyle}
      data-anim={preset.style}
      data-lift={String(preset.hoverLift)}
      data-surface={plan.themeConfig.surface ?? "solid"}
    >
      {/* One shared atmosphere under every section (themeConfig.backdrop; "blobs" = the original glow) */}
      <PageBackdrop kind={plan.themeConfig.backdrop} />

      {formMode === "partner" && (
        <div className="relative z-20 border-b border-hairline bg-card/80 px-4 py-2 text-center text-xs text-mute backdrop-blur">
          Already a partner?{" "}
          <a href="/partner/login" className="font-semibold text-accent hover:underline">
            Sign in to your portal
          </a>
        </div>
      )}
      {order.filter((k) => k === "navbar").map(render)}
      <main className="relative z-10">{order.filter((k) => k !== "navbar" && k !== "footer").map(render)}</main>
      {/* Same stacking as <main>, so the fixed backdrop never paints over the footer */}
      <div className="relative z-10">{order.filter((k) => k === "footer").map(render)}</div>
    </div>
  );
}

/** Renders a partner's saved page (or the original design) through the section registry. */
export function LandingPage({ partner, settings, isCustomPartner = false, page, preview = false, formMode = "lead" }: LandingPageProps) {
  const plan = page ?? ORIGINAL_PAGE;
  const resolved = resolvePage({ partner, settings, isCustomPartner, plan, preview, formMode });
  return (
    <AnimationProvider style={plan.themeConfig.animationStyle}>
      <PageBody page={resolved} plan={plan} formMode={formMode} />
    </AnimationProvider>
  );
}
