"use client";

import type { ReactNode } from "react";
import { SITE_LOGO_LIGHT, SiteLogo } from "@/components/ui/SiteLogo";
import { PartnerSignupForm } from "@/components/partner/PartnerSignupForm";
import { LeadForm } from "../LeadForm";
import { AnimatedText } from "../motion/AnimatedText";
import { Reveal } from "../motion/Reveal";
import type { PageContext } from "./types";

export function scrollToForm() {
  document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
}

export function Container({ children, className = "", size = "xl" }: { children: ReactNode; className?: string; size?: "xl" | "lg" | "md" }) {
  const max = size === "xl" ? "max-w-7xl" : size === "lg" ? "max-w-5xl" : "max-w-4xl";
  return <div className={`mx-auto ${max} px-4 sm:px-6 lg:px-8 ${className}`.trim()}>{children}</div>;
}

/**
 * Below-the-fold section wrapper: skips rendering work until near the viewport, without shifting layout.
 * scroll-mt keeps anchor jumps (#learn, #faq, ...) from landing underneath the sticky navbar.
 */
export function Section({
  id,
  className = "",
  children,
  deferred = true,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  deferred?: boolean;
}) {
  return (
    <section id={id} className={`${deferred ? "" : ""}scroll-mt-20 ${className}`.trim()}>
      {children}
    </section>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ${className}`.trim()}>
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  const alignCls = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-xl text-left";
  return (
    <div className={`${alignCls} ${className}`.trim()}>
      {eyebrow ? (
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <AnimatedText as="h2" text={title} className="rt-h mt-3 text-2xl font-bold tracking-tight text-ink sm:text-4xl" />
      {subtitle ? (
        <Reveal as="p" delay={120} className="mt-3 text-sm text-mute sm:text-base">
          {subtitle}
        </Reveal>
      ) : null}
    </div>
  );
}

/** Themed primary button (look is driven by theme_config.buttonStyle through data-btn on the page root). */
export function CtaButton({
  children,
  className = "",
  onClick,
  href,
  external = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}) {
  const cls = `rt-btn ${className}`.trim();
  if (href) {
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick ?? scrollToForm} className={cls}>
      {children}
    </button>
  );
}

export function BrandLogo({ ctx, className = "h-9" }: { ctx: Pick<PageContext, "logoUrl" | "brandName">; className?: string }) {
  const { logoUrl, brandName } = ctx;
  if (!logoUrl) {
    return (
      <span className="block max-w-[220px] truncate text-lg font-extrabold uppercase leading-8 tracking-wide text-ink" title={brandName}>
        {brandName}
      </span>
    );
  }
  // The bundled site logo has a light and a dark version; an uploaded logo is one image for both themes.
  if (logoUrl === SITE_LOGO_LIGHT) return <SiteLogo className={className} alt={brandName} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={brandName} className={`${className} max-w-[180px] object-contain`} />
  );
}

/** The lead form. In the dev preview a static stand-in is shown so no lead can be created. */
export function HeroForm({ ctx }: { ctx: PageContext }) {
  if (ctx.preview) {
    return (
      <div id="lead-form" data-solid className="scroll-mt-24 rounded-3xl border border-dashed border-hairline-strong bg-card p-8 text-center text-sm text-mute">
        Lead form (disabled in preview)
      </div>
    );
  }
  if (ctx.formMode === "partner") return <PartnerSignupForm />;
  return <LeadForm partnerSlug={ctx.partnerSlug} partnerName={ctx.mentorName} telegramLink={ctx.telegramLink} whatsappLink={ctx.whatsappLink} />;
}

export function TelegramGlyph({ className = "size-4 fill-accent" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.963z" />
    </svg>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
