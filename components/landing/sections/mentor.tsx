"use client";

import { BadgeCheck } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import { Container, Section } from "./ui";
import type { PageContext, SectionProps } from "./types";

type MentorProps = SectionProps<"mentor">;

function MentorLogo({ ctx, className }: { ctx: PageContext; className: string }) {
  if (!ctx.logoUrl) return null;
  return (
    <div className={`flex items-center justify-center border border-hairline bg-bg p-3 shadow-sm ${className}`}>
      <img src={ctx.logoUrl} alt={ctx.mentorName} className="max-h-full max-w-full object-contain" />
    </div>
  );
}

/** Variant 1: the original profile card (identity left, bio right). */
export function Mentor1({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="bg-bg-alt/40 py-16 lg:py-24">
      <Container>
        <Reveal className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg">
          <div className="grid grid-cols-1 items-center gap-8 p-8 sm:p-12 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col items-center text-center lg:col-span-4 lg:items-start lg:text-left">
              <MentorLogo ctx={ctx} className="mb-4 size-24 rounded-2xl" />
              <h3 className="rt-h text-2xl font-bold text-ink">{ctx.mentorName}</h3>
              <p className="text-sm font-medium text-accent">{content.role}</p>
              <div className="mt-4 flex items-center gap-2 rounded-full bg-up/10 px-3 py-1 text-xs font-semibold text-up">
                <span>{content.badge}</span>
              </div>
            </div>
            <div className="lg:col-span-8">
              <h4 className="rt-h text-lg font-bold text-ink sm:text-xl">{content.title}</h4>
              <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{ctx.mentorBio}</p>
              <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{content.body}</p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 2: centred portrait with the bio set as a pull quote. */
export function Mentor2({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="py-16 lg:py-24">
      <Container size="md">
        <Reveal className="text-center">
          <MentorLogo ctx={ctx} className="mx-auto size-28 rounded-full" />
          <h3 className="rt-h mt-5 text-2xl font-bold text-ink sm:text-3xl">{ctx.mentorName}</h3>
          <p className="mt-1 text-sm font-medium text-accent">{content.role}</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-up/10 px-3 py-1 text-xs font-semibold text-up">
            <BadgeCheck className="size-3.5" aria-hidden /> {content.badge}
          </span>
          <h4 className="rt-h mx-auto mt-8 max-w-2xl text-xl font-semibold leading-snug text-ink sm:text-2xl">{content.title}</h4>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-mute">{ctx.mentorBio}</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-mute">{content.body}</p>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 3: split card with a brand-coloured identity panel. */
export function Mentor3({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="bg-bg-alt/30 py-16 lg:py-24">
      <Container size="lg">
        <Reveal className="grid overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg md:grid-cols-5">
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-accent to-accent-2 p-8 text-center text-accent-ink md:col-span-2">
            <MentorLogo ctx={ctx} className="size-24 rounded-2xl bg-white/90" />
            <h3 className="rt-h mt-4 text-xl font-bold">{ctx.mentorName}</h3>
            <p className="mt-1 text-sm opacity-90">{content.role}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              <BadgeCheck className="size-3.5" aria-hidden /> {content.badge}
            </span>
          </div>
          <div className="p-8 sm:p-10 md:col-span-3">
            <h4 className="rt-h text-xl font-bold text-ink">{content.title}</h4>
            <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{ctx.mentorBio}</p>
            <p className="mt-3 text-sm leading-relaxed text-mute">{content.body}</p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
