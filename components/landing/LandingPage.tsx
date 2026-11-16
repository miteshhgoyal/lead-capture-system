"use client";

import { useState } from "react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { LeadForm } from "./LeadForm";
import {
  CountUp,
  AreaChartVisual,
  CandlestickVisual,
  RiskRewardVisual,
} from "./TradingVisuals";
import type { IPartner } from "@/lib/models/Partner";
import type { SiteSettingsData } from "@/lib/defaults";

interface LandingPageProps {
  partner?: Partial<IPartner> | null;
  settings: SiteSettingsData;
  isCustomPartner?: boolean;
}

export function LandingPage({
  partner,
  settings,
  isCustomPartner = false,
}: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const brandName = isCustomPartner && partner?.name ? partner.name : settings.brandName;
  const brandTagline = isCustomPartner && partner?.tagline ? partner.tagline : settings.headline;
  const logoUrl = partner?.logoUrl || settings.logoUrl || "/tp-logo-light.png";
  const mentorName = partner?.name || settings.defaultMentorName;
  const mentorBio = partner?.mentorBio || settings.defaultMentorBio;
  const telegramLink = partner?.telegramLink || settings.defaultTelegramLink;
  const partnerSlug = partner?.slug || "direct";

  const scrollToForm = () => {
    const el = document.getElementById("lead-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink transition-colors duration-300">
      {/* ── Background Glow Blobs ───────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="f-blob a" />
        <div className="f-blob b" />
        <div className="f-blob c" />
      </div>

      {/* ── Navigation Bar ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-hairline/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <div className="relative h-8 w-auto min-w-8">
                {logoUrl.startsWith("/") ? (
                  <Image
                    src={logoUrl}
                    alt={brandName}
                    width={180}
                    height={40}
                    priority
                    className="h-8 w-auto object-contain block dark:hidden"
                  />
                ) : (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="h-8 max-w-[160px] object-contain"
                  />
                )}
                {logoUrl.startsWith("/") && (
                  <Image
                    src="/tp-logo-dark.png"
                    alt={brandName}
                    width={180}
                    height={40}
                    priority
                    className="h-8 w-auto object-contain hidden dark:block"
                  />
                )}
              </div>
            )}
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-mute md:flex">
            <a href="#learn" className="hover:text-ink transition-colors">
              What You&apos;ll Learn
            </a>
            <a href="#how" className="hover:text-ink transition-colors">
              How It Works
            </a>
            <a href="#mentor" className="hover:text-ink transition-colors">
              About Mentor
            </a>
            <a href="#faq" className="hover:text-ink transition-colors">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={scrollToForm}
              className="hidden rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-ink shadow-sm transition hover:brightness-110 sm:inline-block"
            >
              Get Free Pass →
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── SECTION 1 & 2: HERO & LEAD FORM ─────────────────────────── */}
        <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
              {/* Left Column: Hero Headline & Value Proposition */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-card/60 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
                  <span className="flex size-2 rounded-full bg-up animate-pulse" />
                  <span className="text-mute">
                    {settings.trustLine || "100% Free · Join 60,000+ Enrolled Students"}
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-[54px] lg:leading-[1.12]">
                  {brandTagline}
                </h1>

                <p className="mt-4 max-w-2xl text-base text-mute sm:text-lg">
                  {settings.subheadline}
                </p>

                {/* Key Highlights */}
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card/70 p-3.5 backdrop-blur-sm">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-ink">Live Interactive Zoom</h4>
                      <p className="text-[11px] text-mute">Direct live Q&A with real chart reviews</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card/70 p-3.5 backdrop-blur-sm">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-up/10 text-up font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-ink">Zero Prior Experience</h4>
                      <p className="text-[11px] text-mute">From basics to advanced technical setups</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card/70 p-3.5 backdrop-blur-sm">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-ink">Strict Risk Models</h4>
                      <p className="text-[11px] text-mute">1:3 asymmetric reward ratio systems</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-card/70 p-3.5 backdrop-blur-sm">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-up/10 text-up font-bold">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-ink">Telegram VIP Access</h4>
                      <p className="text-[11px] text-mute">Free chart templates & market guides</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Jump Button */}
                <div className="mt-8 block lg:hidden">
                  <button
                    onClick={scrollToForm}
                    className="w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-accent-ink shadow-lg shadow-accent/25"
                  >
                    Claim Your Free Pass Now ↓
                  </button>
                </div>
              </div>

              {/* Right Column: High-Converting Lead Form (Sticky on desktop) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                <LeadForm
                  partnerSlug={partnerSlug}
                  partnerName={mentorName}
                  telegramLink={telegramLink}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: WHAT YOU'LL LEARN ────────────────────────────── */}
        <section id="learn" className="border-t border-hairline bg-bg-alt/50 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                CORE CURRICULUM
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-4xl">
                What You&apos;ll Master in This Free Session
              </h2>
              <p className="mt-3 text-sm text-mute sm:text-base">
                No random indicators or guesswork. Learn how institutional traders analyze liquidity,
                structure high-probability trades, and protect capital in any market condition.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Pillar 1: Price Action with Chart Visual */}
              <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent font-bold text-xl">
                    📈
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">
                    Institutional Price Action & Market Structure
                  </h3>
                  <p className="mt-2 text-sm text-mute">
                    Understand where big orders sit. Read support, resistance, liquidity sweeps, and
                    candlestick confirmation without relying on cluttered indicators.
                  </p>
                </div>
                <div className="mt-6">
                  <AreaChartVisual />
                </div>
              </div>

              {/* Pillar 2: Risk Management & Position Sizing */}
              <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-up/10 text-up font-bold text-xl">
                    🛡️
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">
                    Disciplined Risk Management & Asymmetric R:R
                  </h3>
                  <p className="mt-2 text-sm text-mute">
                    Professional traders survive through capital preservation. Master strict stop-loss
                    placement, position sizing algorithms, and never risk more than 1% per trade.
                  </p>
                </div>
                <div className="mt-6">
                  <RiskRewardVisual />
                </div>
              </div>

              {/* Pillar 3: Candlestick Confirmation */}
              <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent font-bold text-xl">
                    🕯️
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">
                    Candlestick Mechanics & Entry Triggers
                  </h3>
                  <p className="mt-2 text-sm text-mute">
                    Recognize high-conviction continuation and reversal candlestick patterns. Know
                    the precise bar close required before pulling the trigger.
                  </p>
                </div>
                <div className="mt-6">
                  <CandlestickVisual />
                </div>
              </div>

              {/* Pillar 4: Trading Psychology & Emotional Control */}
              <div className="flex flex-col justify-between rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div>
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-down/10 text-down font-bold text-xl">
                    🧠
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink">
                    Trading Psychology & Emotion Management
                  </h3>
                  <p className="mt-2 text-sm text-mute">
                    Eliminate revenge trading, FOMO, and premature exits. Learn the daily routines and
                    journaling habits used by consistently profitable market operators.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl border border-hairline bg-card p-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-mute">
                    <span>Trader Discipline Score</span>
                    <span className="font-bold text-up">94% Target Compliance</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-mute">Zero Revenge Trades</span>
                      <span className="font-semibold text-ink">100% Enforced</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-mute">Max Daily Loss Cutoff</span>
                      <span className="font-semibold text-ink">2% Total Capital</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: HOW THE FREE SESSION WORKS (3 STEPS) ─────────── */}
        <section id="how" className="border-t border-hairline py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                SIMPLE 3-STEP PROCESS
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-4xl">
                How It Works: From Sign-Up to Live Class
              </h2>
              <p className="mt-3 text-sm text-mute sm:text-base">
                Zero complicated setup. You can reserve your seat and receive your access credentials
                in less than 60 seconds.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-ink font-bold text-lg">
                  1
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink sm:text-xl">
                  Register Your Free Pass
                </h3>
                <p className="mt-2 text-sm text-mute">
                  Fill in your name, WhatsApp number, and trading background in the quick form on this
                  page.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-ink font-bold text-lg">
                  2
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink sm:text-xl">
                  Get Zoom Link on Telegram
                </h3>
                <p className="mt-2 text-sm text-mute">
                  Receive your personal Zoom meeting room ID, calendar reminder, and session prep kit
                  directly on WhatsApp and Telegram.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-3xl border border-hairline bg-card p-6 shadow-sm sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-ink font-bold text-lg">
                  3
                </div>
                <h3 className="mt-5 text-lg font-bold text-ink sm:text-xl">
                  Attend Live & Trade Confidently
                </h3>
                <p className="mt-2 text-sm text-mute">
                  Join the live webinar on Zoom, watch live chart breakdowns, and get your doubts
                  cleared in the interactive mentor Q&A.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: ABOUT THE MENTOR / PARTNER ──────────────────── */}
        <section id="mentor" className="border-t border-hairline bg-bg-alt/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-hairline bg-card shadow-lg">
              <div className="grid grid-cols-1 items-center gap-8 p-8 sm:p-12 lg:grid-cols-12 lg:gap-12">
                <div className="flex flex-col items-center text-center lg:col-span-4 lg:items-start lg:text-left">
                  {logoUrl && (
                    <div className="mb-4 flex size-24 items-center justify-center rounded-2xl border border-hairline bg-bg p-3 shadow-sm">
                      <img
                        src={logoUrl}
                        alt={mentorName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-ink">{mentorName}</h3>
                  <p className="text-sm font-medium text-accent">Lead Market Mentor & Educator</p>
                  <div className="mt-4 flex items-center gap-2 rounded-full bg-up/10 px-3 py-1 text-xs font-semibold text-up">
                    <span>Verified Technical Analyst</span>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <h4 className="text-lg font-bold text-ink sm:text-xl">
                    Dedicated to Creating Disciplined, Independent Traders
                  </h4>
                  <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">
                    {mentorBio}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-mute sm:text-base">
                    With over 8 years of active market experience across equities, commodities, and
                    currencies, our approach is centered around risk mitigation, probabilistic edge,
                    and realistic expectations. We reject overnight-wealth myths in favor of structured,
                    sustainable trading habits.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-bg px-4 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-hairline"
                    >
                      <svg className="size-4 fill-accent" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.963z" />
                      </svg>
                      Connect on Telegram Channel
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: SOCIAL PROOF / STATS COUNTERS ────────────────── */}
        <section className="border-t border-hairline py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 md:gap-8">
              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
                <div className="text-2xl font-extrabold text-ink sm:text-4xl">
                  <CountUp end={60000} suffix="+" />
                </div>
                <div className="mt-1 text-xs font-medium text-mute sm:text-sm">
                  Students Mentored
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
                <div className="text-2xl font-extrabold text-ink sm:text-4xl">
                  <CountUp end={4.9} decimals={1} suffix=" / 5" />
                </div>
                <div className="mt-1 text-xs font-medium text-mute sm:text-sm">
                  Average Learner Rating
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
                <div className="text-2xl font-extrabold text-ink sm:text-4xl">
                  <CountUp end={92} suffix="%" />
                </div>
                <div className="mt-1 text-xs font-medium text-mute sm:text-sm">
                  Positive Feedback Rate
                </div>
              </div>

              <div className="rounded-2xl border border-hairline bg-card p-6 shadow-sm">
                <div className="text-2xl font-extrabold text-ink sm:text-4xl">
                  100%
                </div>
                <div className="mt-1 text-xs font-medium text-mute sm:text-sm">
                  Free Live Access
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: FREQUENTLY ASKED QUESTIONS (FAQ) ─────────────── */}
        <section id="faq" className="border-t border-hairline bg-bg-alt/30 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                GOT QUESTIONS?
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-sm text-mute sm:text-base">
                Everything you need to know about the free masterclass and live access.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {(settings.faqs || []).map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-hairline bg-card transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-ink sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <span className="ml-4 text-mute">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-hairline px-5 pb-5 pt-3 text-xs leading-relaxed text-mute sm:text-sm">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECTION 8: FINAL CTA & FOOTER WITH RISK DISCLAIMER ───────── */}
        <section className="border-t border-hairline py-16 lg:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card p-8 text-center shadow-xl sm:p-12">
              <div className="relative z-10 mx-auto max-w-2xl">
                <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  RESERVE YOUR FREE SPOT
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-4xl">
                  Ready to Level Up Your Trading Game?
                </h2>
                <p className="mt-3 text-sm text-mute sm:text-base">
                  Seats for the live Zoom room are strictly limited to maintain high audio/video
                  clarity and interactive Q&A. Claim your pass now before registration closes.
                </p>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={scrollToForm}
                    className="rounded-xl bg-accent px-8 py-4 text-base font-semibold text-accent-ink shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-[0.98]"
                  >
                    Claim My Free Pass Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER & RISK DISCLAIMER ─────────────────────────────────── */}
      <footer className="border-t border-hairline bg-bg-alt/80 py-12 text-xs text-mute">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">{brandName}</span>
              <span>·</span>
              <span>Trading Education & Mentorship</span>
            </div>
            <div>© {new Date().getFullYear()} {brandName}. All rights reserved.</div>
          </div>

          {/* Mandatory Risk Disclaimer */}
          <div className="mt-8 rounded-2xl border border-hairline bg-card/60 p-4 text-[11px] leading-relaxed text-faint">
            <b className="font-semibold text-mute">Risk Disclaimer: </b>
            {settings.disclaimer ||
              "Trading involves risk. Educational purposes only. No guaranteed returns."}
          </div>
        </div>
      </footer>
    </div>
  );
}
