"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "../motion/Reveal";
import { Container, Section, SectionHeader } from "./ui";
import type { SectionProps } from "./types";

type FaqProps = SectionProps<"faq">;
type QA = { q: string; a: string };

function itemsOf({ content, ctx }: FaqProps): QA[] {
  return content.items && content.items.length > 0 ? content.items : ctx.faqs;
}

/** One question button + answer panel, controlled from outside so layouts can choose single/multi open. */
function Disclosure({ qa, open, onToggle, className, index = 0, spot = false }: { qa: QA; open: boolean; onToggle: () => void; className: string; index?: number; spot?: boolean }) {
  const uid = useId();
  return (
    <Reveal index={index} spot={spot} className={className}>
      <h3>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${uid}-p`} className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm font-semibold text-ink sm:text-base">
          <span>{qa.q}</span>
          <ChevronDown className={`size-4 shrink-0 text-mute transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </h3>
      {open ? (
        <div id={`${uid}-p`} role="region" className="px-5 pb-5 text-sm leading-relaxed text-mute">
          {qa.a}
        </div>
      ) : null}
    </Reveal>
  );
}

function Column({ items, offset }: { items: QA[]; offset: number }) {
  const [open, setOpen] = useState<number | null>(offset === 0 ? 0 : null);
  return (
    <div className="space-y-3">
      {items.map((qa, i) => (
        <Disclosure key={i} qa={qa} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} className="overflow-hidden rounded-2xl border border-hairline bg-card shadow-sm" />
      ))}
    </div>
  );
}

/** Variant 4: two accordions side by side, each opening on its own. */
export function Faq4(props: FaqProps) {
  const { content } = props;
  const items = itemsOf(props);
  const half = Math.ceil(items.length / 2);
  return (
    <Section id="faq" className="py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-10 grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-5">
          <Column items={items.slice(0, half)} offset={0} />
          <Column items={items.slice(half)} offset={half} />
        </div>
      </Container>
    </Section>
  );
}

/** Variant 5: a grid of spotlight cards that each unfold in place. */
export function Faq5(props: FaqProps) {
  const { content } = props;
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <Section id="faq" className="rt-tint py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {itemsOf(props).map((qa, i) => (
            <Disclosure key={i} qa={qa} index={i % 3} spot open={open.has(i)} onToggle={() => toggle(i)} className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-sm" />
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 6: the whole FAQ as a chat. The question on the right, the reply on the left. */
export function Faq6(props: FaqProps) {
  const { content } = props;
  return (
    <Section id="faq" className="py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 space-y-5">
          {itemsOf(props).map((qa, i) => (
            <Reveal key={i} index={i % 2} className="space-y-2">
              <div className="flex justify-end">
                <p className="max-w-[88%] rounded-3xl rounded-br-md bg-accent px-5 py-3 text-sm font-semibold text-accent-ink shadow-sm sm:max-w-[75%]">{qa.q}</p>
              </div>
              <div className="flex justify-start">
                <p className="max-w-[88%] rounded-3xl rounded-bl-md border border-hairline bg-card px-5 py-3.5 text-sm leading-relaxed text-mute shadow-sm sm:max-w-[75%]">{qa.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 7: native <details> rows (no JavaScript needed) with an accent bar on the open one. */
export function Faq7(props: FaqProps) {
  const { content } = props;
  return (
    <Section id="faq" className="rt-tint py-16 lg:py-24">
      <Container size="md">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-10 space-y-3">
          {itemsOf(props).map((qa, i) => (
            <Reveal key={i} index={i} className="group/faq">
              <details open={i === 0} className="group overflow-hidden rounded-2xl border border-l-4 border-hairline border-l-hairline-strong bg-card shadow-sm transition-colors open:border-l-accent">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold text-ink marker:hidden sm:text-base [&::-webkit-details-marker]:hidden">
                  {qa.q}
                  <ChevronDown className="size-4 shrink-0 text-mute transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-mute">{qa.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 8: questions as a list on the left, the selected answer shown large on the right. */
export function Faq8(props: FaqProps) {
  const { content } = props;
  const items = itemsOf(props);
  const [active, setActive] = useState(0);
  const qa = items[active] ?? items[0];
  return (
    <Section id="faq" className="py-16 lg:py-24">
      <Container>
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-8">
          <div role="tablist" aria-label={content.title} className="space-y-2 lg:col-span-5">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-controls="faq-answer"
                onClick={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition ${i === active ? "border-accent/40 bg-accent/10 text-ink" : "border-hairline bg-card text-mute hover:text-ink"}`}
              >
                <span className={`text-xs font-bold tabular-nums ${i === active ? "text-accent" : "text-faint"}`}>{String(i + 1).padStart(2, "0")}</span>
                {it.q}
              </button>
            ))}
          </div>
          {qa ? (
            <div id="faq-answer" role="tabpanel" className="rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-9 lg:col-span-7">
              <h3 className="rt-h text-xl font-bold text-ink sm:text-2xl">{qa.q}</h3>
              <p className="mt-4 text-sm leading-relaxed text-mute sm:text-base">{qa.a}</p>
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

/** Variant 9: every answer visible, numbered with large gradient figures. */
export function Faq9(props: FaqProps) {
  const { content } = props;
  return (
    <Section id="faq" className="rt-tint py-16 lg:py-24">
      <Container size="lg">
        <SectionHeader eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <dl className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
          {itemsOf(props).map((qa, i) => (
            <Reveal key={i} index={i % 2} className="flex gap-5">
              <span className="rt-gradient-text text-4xl font-extrabold leading-none tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 border-t border-hairline pt-3">
                <dt className="text-sm font-semibold text-ink sm:text-base">{qa.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-mute">{qa.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}

