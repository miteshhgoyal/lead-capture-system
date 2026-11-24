"use client";

import { BadgeCheck, Quote } from "lucide-react";
import { Aurora, Noise } from "../fx/backgrounds";
import { StarBorder, TiltCard } from "../fx/interactive";
import { Reveal } from "../motion/Reveal";
import { MentorAvatar } from "./kit";
import { Container, Section } from "./ui";
import type { SectionProps } from "./types";

type MentorProps = SectionProps<"mentor">;

function Badge({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ${className}`.trim()}>
      <BadgeCheck className="size-3.5" aria-hidden /> {children}
    </span>
  );
}

/** Variant 4: centred profile on a soft aurora, the portrait ringed by a comet. */
export function Mentor4({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="py-16 lg:py-24">
      <Container size="lg">
        <Reveal className="relative overflow-hidden rounded-3xl border border-hairline bg-card px-6 py-12 text-center shadow-lg sm:px-12">
          <Aurora soft fade="none" />
          <div className="relative">
            <StarBorder rounded="rounded-full" className="mx-auto w-fit">
              <MentorAvatar ctx={ctx} className="size-28 rounded-full" />
            </StarBorder>
            <h3 className="rt-h mt-5 text-2xl font-bold text-ink sm:text-3xl">{ctx.mentorName}</h3>
            <p className="mt-1 text-sm font-medium text-accent">{content.role}</p>
            <Badge className="mt-3">{content.badge}</Badge>
            <h4 className="rt-h mx-auto mt-8 max-w-2xl text-xl font-semibold leading-snug text-ink sm:text-2xl">{content.title}</h4>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-mute sm:text-base">{ctx.mentorBio}</p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-mute">{content.body}</p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 5: identity pinned on the left, the story set as a large pull quote on the right. */
export function Mentor5({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="rt-tint py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="flex items-center gap-4 lg:sticky lg:top-28 lg:flex-col lg:items-start lg:gap-5">
              <MentorAvatar ctx={ctx} className="size-20 rounded-2xl lg:size-28" />
              <div>
                <h3 className="rt-h text-xl font-bold text-ink sm:text-2xl">{ctx.mentorName}</h3>
                <p className="text-sm font-medium text-accent">{content.role}</p>
                <Badge className="mt-3">{content.badge}</Badge>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-8">
            <Quote className="size-10 text-accent/30" aria-hidden />
            <h4 className="rt-h mt-3 text-2xl font-semibold leading-snug text-ink sm:text-3xl">{content.title}</h4>
            <p className="mt-5 text-base leading-relaxed text-mute">{ctx.mentorBio}</p>
            <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{content.body}</p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 6: a brand banner with the portrait overlapping its bottom edge. */
export function Mentor6({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="py-16 lg:py-24">
      <Container size="lg">
        <Reveal className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg">
          <div className="relative h-28 bg-gradient-to-r from-accent to-accent-2 sm:h-36">
            <Noise />
          </div>
          <div className="px-6 pb-10 text-center sm:px-12">
            <MentorAvatar ctx={ctx} className="-mt-12 mx-auto size-24 rounded-full ring-4 ring-card" />
            <h3 className="rt-h mt-4 text-2xl font-bold text-ink">{ctx.mentorName}</h3>
            <p className="mt-1 text-sm font-medium text-accent">{content.role}</p>
            <Badge className="mt-3">{content.badge}</Badge>
            <h4 className="rt-h mx-auto mt-7 max-w-2xl text-lg font-bold text-ink sm:text-xl">{content.title}</h4>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-mute sm:text-base">{ctx.mentorBio}</p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-mute">{content.body}</p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 7: an ID-card that tilts toward the cursor, with the story beside it. */
export function Mentor7({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="rt-tint py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="mx-auto w-full max-w-sm lg:col-span-5">
            <TiltCard>
              <Reveal className="relative overflow-hidden rounded-3xl border border-hairline bg-card p-7 text-center shadow-xl">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-accent to-accent-2" />
                <MentorAvatar ctx={ctx} className="mx-auto size-28 rounded-3xl" />
                <h3 className="rt-h mt-5 text-xl font-bold text-ink">{ctx.mentorName}</h3>
                <p className="mt-1 text-sm font-medium text-accent">{content.role}</p>
                <div className="my-5 border-t border-dashed border-hairline-strong" />
                <Badge>{content.badge}</Badge>
              </Reveal>
            </TiltCard>
          </div>
          <Reveal delay={100} className="lg:col-span-7">
            <h4 className="rt-h text-2xl font-bold tracking-tight text-ink sm:text-3xl">{content.title}</h4>
            <p className="mt-4 text-base leading-relaxed text-mute">{ctx.mentorBio}</p>
            <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">{content.body}</p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

/** Variant 8: editorial. Big headline, the two paragraphs in columns, a signature line. */
export function Mentor8({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="py-16 lg:py-24">
      <Container size="lg">
        <Reveal>
          <Badge>{content.badge}</Badge>
          <h4 className="rt-h mt-4 max-w-3xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">{content.title}</h4>
        </Reveal>
        <Reveal delay={100} className="mt-8 grid grid-cols-1 gap-6 text-sm leading-relaxed text-mute sm:text-base md:grid-cols-2 md:gap-10">
          <p>{ctx.mentorBio}</p>
          <p>{content.body}</p>
        </Reveal>
        <Reveal delay={150} className="mt-10 flex items-center gap-4 border-t border-hairline pt-6">
          <MentorAvatar ctx={ctx} className="size-14 rounded-full" />
          <div>
            <div className="text-sm font-bold text-ink">{ctx.mentorName}</div>
            <div className="text-xs font-medium text-accent">{content.role}</div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/** Variant 9: one wide frosted strip: portrait, story, badge. */
export function Mentor9({ content, ctx }: MentorProps) {
  return (
    <Section id="mentor" className="rt-tint py-16 lg:py-24">
      <Container>
        <Reveal spot className="relative overflow-hidden rounded-3xl border border-hairline bg-card/85 p-6 shadow-lg backdrop-blur-sm sm:p-9">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr_auto] md:gap-9">
            <MentorAvatar ctx={ctx} className="size-24 rounded-2xl md:size-28" />
            <div>
              <h3 className="rt-h text-xl font-bold text-ink sm:text-2xl">{ctx.mentorName}</h3>
              <p className="text-sm font-medium text-accent">{content.role}</p>
              <h4 className="rt-h mt-4 text-base font-bold text-ink sm:text-lg">{content.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-mute">{ctx.mentorBio}</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">{content.body}</p>
            </div>
            <Badge className="justify-self-start md:self-start">{content.badge}</Badge>
          </div>
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent via-accent-2 to-accent" />
        </Reveal>
      </Container>
    </Section>
  );
}
