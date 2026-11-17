"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type FaqProps = SectionProps<"faq">;
type QA = { q: string; a: string };

function itemsOf({ content, ctx }: FaqProps): QA[] {
  return content.items && content.items.length > 0 ? content.items : ctx.faqs;
}

function AccordionRow({
  qa,
  open,
  onToggle,
  index,
  className,
  numbered = false,
}: {
  qa: QA;
  open: boolean;
  onToggle: () => void;
  index: number;
  className: string;
  numbered?: boolean;
}) {
  const uid = useId();
  const panel = `${uid}-panel`;
  return (
    <Reveal index={index} className={className}>
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panel}
          className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-ink sm:text-base"
        >
          <span className="flex items-center gap-3">
            {numbered ? <span className="text-xs font-bold tabular-nums text-accent">{String(index + 1).padStart(2, "0")}</span> : null}
            {qa.q}
          </span>
          {open ? <Minus className="size-4 shrink-0 text-mute" aria-hidden /> : <Plus className="size-4 shrink-0 text-mute" aria-hidden />}
        </button>
      </h3>
      {open ? (
        <div id={panel} role="region" className="border-t border-hairline px-5 pb-5 pt-3 text-xs leading-relaxed text-mute sm:text-sm">
          {qa.a}
        </div>
      ) : null}
    </Reveal>
  );
}

/** Variant 1: the original single-open accordion. */
export function Faq1(props: FaqProps) {
  const { content } = props;
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section id="faq" className="bg-bg-alt/30 py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-10 space-y-3">
          {itemsOf(props).map((qa, i) => (
            <AccordionRow
              key={i}
              qa={qa}
              index={i}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              className="overflow-hidden rounded-2xl border border-hairline bg-card transition"
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 2: every answer visible, laid out in two columns. */
export function Faq2(props: FaqProps) {
  const { content } = props;
  return (
    <Section id="faq" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <dl className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
          {itemsOf(props).map((qa, i) => (
            <Reveal key={i} index={i % 2} className="rt-lift rounded-2xl border border-hairline bg-card p-6 shadow-sm">
              <dt className="text-sm font-semibold text-ink sm:text-base">{qa.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-mute">{qa.a}</dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}

/** Variant 3: sticky heading beside a numbered, multi-open accordion. */
export function Faq3(props: FaqProps) {
  const { content } = props;
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <Section id="faq" className="bg-bg-alt/40 py-16 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <SectionHeader align="left" eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            </div>
          </div>
          <div className="divide-y divide-hairline rounded-3xl border border-hairline bg-card lg:col-span-8">
            {itemsOf(props).map((qa, i) => (
              <AccordionRow key={i} qa={qa} index={i} numbered open={open.has(i)} onToggle={() => toggle(i)} className="" />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
