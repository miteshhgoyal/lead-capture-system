/**
 * Content pools. Entry #1 of every section is the copy the landing page originally shipped with,
 * so a "legacy" page reads exactly as before. The rest are alternatives for the randomizer.
 *
 * Placeholders ({{name}}) are filled at render time from the partner's real data, see resolve.ts:
 *   {{partnerName}}  partner name (or the default mentor name)
 *   {{brand}}        brand name shown in the header/footer
 *   {{headline}}     partner tagline, else the site headline
 *   {{subheadline}}  site subheadline
 *   {{trustLine}}    site trust line
 *   {{tagline}}      partner tagline, else the site subheadline
 */
import type {
  CtaContent,
  FaqContent,
  FeaturesContent,
  FooterContent,
  HeroContent,
  HeroHighlight,
  MentorContent,
  MetaContent,
  NavbarContent,
  OfferContent,
  SectionContentMap,
  SectionKey,
  StatsContent,
  StepsContent,
  TestimonialsContent,
} from "./types";

export interface PoolEntry<T> {
  id: string;
  content: T;
}

export type ContentPools = { [K in SectionKey]: PoolEntry<SectionContentMap[K]>[] } & {
  meta: PoolEntry<MetaContent>[];
};

function pool<T>(prefix: string, entries: T[]): PoolEntry<T>[] {
  return entries.map((content, i) => ({ id: `${prefix}_c${i + 1}`, content }));
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */

const ORIGINAL_HIGHLIGHTS: HeroHighlight[] = [
  { icon: "video", title: "Live Interactive Zoom", body: "Direct live Q&A with real chart reviews" },
  { icon: "graduation", title: "Zero Prior Experience", body: "From basics to advanced technical setups" },
  { icon: "shield", title: "Strict Risk Models", body: "1:3 asymmetric reward ratio systems" },
  { icon: "send", title: "Telegram VIP Access", body: "Free chart templates & market guides" },
];

const PLAN_HIGHLIGHTS: HeroHighlight[] = [
  { icon: "video", title: "Live on Zoom", body: "Watch charts analysed in real time" },
  { icon: "target", title: "Beginner friendly", body: "Clear fundamentals, no jargon wall" },
  { icon: "shield", title: "Risk comes first", body: "Position sizing and stop placement" },
  { icon: "users", title: "Community access", body: "Resources shared on Telegram" },
];

const HABIT_HIGHLIGHTS: HeroHighlight[] = [
  { icon: "chart", title: "Price action focus", body: "Structure, levels and candles" },
  { icon: "brain", title: "Trading psychology", body: "Handle fear, greed and FOMO" },
  { icon: "message", title: "Live Q&A", body: "Bring your own charts and questions" },
  { icon: "gift", title: "Free to attend", body: "No payment needed to join" },
];

const hero: HeroContent[] = [
  {
    badge: "{{trustLine}}",
    headline: "{{headline}}",
    subheadline: "{{subheadline}}",
    mobileCta: "Claim Your Free Pass Now",
    highlights: ORIGINAL_HIGHLIGHTS,
  },
  {
    badge: "Free live masterclass",
    headline: "Learn To Read Charts Like A Professional Trader",
    subheadline: "A free live session with {{partnerName}}: price action, risk control and real chart reviews. No experience needed.",
    mobileCta: "Reserve My Free Seat",
    highlights: PLAN_HIGHLIGHTS,
  },
  {
    badge: "100% free · Live on Zoom",
    headline: "Stop Guessing. Start Trading With A Plan.",
    subheadline: "Join {{partnerName}} for a practical, step-by-step introduction to market structure and risk management.",
    mobileCta: "Get My Free Pass",
    highlights: HABIT_HIGHLIGHTS,
  },
  {
    badge: "Beginner friendly",
    headline: "Your First Step Toward Disciplined Trading",
    subheadline: "Understand how markets move, how to size risk and how to build a routine you can stick to. Live, free and easy to follow.",
    mobileCta: "Save My Spot",
    highlights: ORIGINAL_HIGHLIGHTS,
  },
  {
    badge: "Live chart walkthroughs",
    headline: "Trade With Structure, Not Emotion",
    subheadline: "{{partnerName}} walks you through price action, entries and exits on live charts, with time set aside for your questions.",
    mobileCta: "Join The Free Class",
    highlights: PLAN_HIGHLIGHTS,
  },
  {
    badge: "Free session · Limited seats",
    headline: "Free Live Class: Price Action, Risk And Psychology",
    subheadline: "Three skills every consistent trader needs, taught live by {{partnerName}} in one focused session.",
    mobileCta: "Claim My Seat",
    highlights: HABIT_HIGHLIGHTS,
  },
  {
    badge: "Learn the habits that last",
    headline: "Learn The Habits Behind Consistent Trading",
    subheadline: "No indicator overload. A clear framework for reading price, protecting capital and reviewing your own trades.",
    mobileCta: "Get Free Access",
    highlights: ORIGINAL_HIGHLIGHTS,
  },
  {
    badge: "{{brand}} masterclass",
    headline: "Build Your Trading Foundation With {{partnerName}}",
    subheadline: "Reserve a free seat in the next live masterclass and get your joining details on WhatsApp and Telegram.",
    mobileCta: "Reserve My Seat",
    highlights: PLAN_HIGHLIGHTS,
  },
  {
    badge: "Free · Live · Interactive",
    headline: "A Practical Trading Masterclass, Completely Free",
    subheadline: "Live chart breakdowns, risk rules you can apply straight away and an open Q&A with {{partnerName}}.",
    mobileCta: "Register Free Now",
    highlights: HABIT_HIGHLIGHTS,
  },
];

/* ── Features ──────────────────────────────────────────────────────────────── */

const features: FeaturesContent[] = [
  {
    eyebrow: "CORE CURRICULUM",
    title: "What You'll Master in This Free Session",
    subtitle:
      "No random indicators or guesswork. Learn how institutional traders analyze liquidity, structure high-probability trades, and protect capital in any market condition.",
    items: [
      {
        icon: "trend",
        visual: "area",
        title: "Institutional Price Action & Market Structure",
        body: "Understand where big orders sit. Read support, resistance, liquidity sweeps, and candlestick confirmation without relying on cluttered indicators.",
      },
      {
        icon: "shield",
        visual: "risk",
        title: "Disciplined Risk Management & Asymmetric R:R",
        body: "Professional traders survive through capital preservation. Master strict stop-loss placement, position sizing algorithms, and never risk more than 1% per trade.",
      },
      {
        icon: "candles",
        visual: "candles",
        title: "Candlestick Mechanics & Entry Triggers",
        body: "Recognize high-conviction continuation and reversal candlestick patterns. Know the precise bar close required before pulling the trigger.",
      },
      {
        icon: "brain",
        visual: "discipline",
        title: "Trading Psychology & Emotion Management",
        body: "Eliminate revenge trading, FOMO, and premature exits. Learn the daily routines and journaling habits used by consistently profitable market operators.",
      },
    ],
  },
  {
    eyebrow: "WHAT YOU WILL LEARN",
    title: "Four Skills Every Trader Needs",
    subtitle: "A focused curriculum built around the fundamentals that matter most, explained with live examples.",
    items: [
      { icon: "trend", title: "Reading market structure", body: "Spot trends, ranges and turning points by looking at price instead of stacking indicators." },
      { icon: "shield", title: "Managing risk per trade", body: "Size positions and place stops so one bad trade never decides your month." },
      { icon: "target", title: "Planning entries and exits", body: "Decide where you are wrong before you enter and where you will take profit." },
      { icon: "calendar", title: "Building a routine", body: "Create a repeatable pre-market and review habit you can keep up." },
    ],
  },
  {
    eyebrow: "INSIDE THE SESSION",
    title: "What We Cover, Live",
    subtitle: "Every topic is taught on real charts so you can see the idea applied, not just described.",
    items: [
      { icon: "video", title: "Live chart walkthroughs", body: "Follow the analysis step by step as {{partnerName}} marks levels and reads price in real time." },
      { icon: "chart", title: "Position sizing basics", body: "A simple method to decide how much to risk on any setup." },
      { icon: "book", title: "Journaling your trades", body: "Track what you did and why, so you improve with every session." },
      { icon: "brain", title: "Handling losing streaks", body: "Practical ways to stay objective when the market does not cooperate." },
    ],
  },
  {
    eyebrow: "SKILLS YOU GAIN",
    title: "Skills You Walk Away With",
    subtitle: "Concrete, repeatable techniques you can start practising on your own charts right after the session.",
    items: [
      { icon: "target", title: "Find key support and resistance", body: "Mark the levels that matter and ignore the noise around them." },
      { icon: "candles", title: "Confirm entries with candles", body: "Use candle closes to confirm a setup instead of anticipating it." },
      { icon: "shield", title: "Protect your capital", body: "Build rules that keep your downside small and your decisions calm." },
      { icon: "brain", title: "Stay composed under pressure", body: "Spot the emotional traps that cause rushed, avoidable trades." },
    ],
  },
  {
    eyebrow: "WHO IT'S FOR",
    title: "Built For Beginners And Improving Traders",
    subtitle: "Whether you are placing your first trade or trying to become more consistent, the session meets you where you are.",
    items: [
      { icon: "graduation", title: "Clear fundamentals", body: "Start from the basics and build up to professional-grade chart reading." },
      { icon: "book", title: "Practical frameworks", body: "Simple checklists you can reuse on any market and any timeframe." },
      { icon: "video", title: "Real, live examples", body: "Charts from current markets, analysed in front of you." },
      { icon: "users", title: "Community support", body: "Keep learning with fellow traders in the Telegram community." },
    ],
  },
];

/* ── Steps ─────────────────────────────────────────────────────────────────── */

const steps: StepsContent[] = [
  {
    eyebrow: "SIMPLE 3-STEP PROCESS",
    title: "How It Works: From Sign-Up to Live Class",
    subtitle: "Zero complicated setup. You can reserve your seat and receive your access credentials in less than 60 seconds.",
    items: [
      { title: "Register Your Free Pass", body: "Fill in your name, WhatsApp number, and trading background in the quick form on this page." },
      {
        title: "Get Zoom Link on Telegram",
        body: "Receive your personal Zoom meeting room ID, calendar reminder, and session prep kit directly on WhatsApp and Telegram.",
      },
      {
        title: "Attend Live & Trade Confidently",
        body: "Join the live webinar on Zoom, watch live chart breakdowns, and get your doubts cleared in the interactive mentor Q&A.",
      },
    ],
  },
  {
    eyebrow: "THREE QUICK STEPS",
    title: "Three Steps To Your Seat",
    subtitle: "Reserving your place takes about a minute and costs nothing.",
    items: [
      { title: "Register in a minute", body: "Share a few basic details in the form on this page." },
      { title: "Check your messages", body: "Your joining link and preparation notes arrive on WhatsApp and email." },
      { title: "Join the live class", body: "Log in on the day, follow the charts live and ask your questions." },
    ],
  },
  {
    eyebrow: "GETTING STARTED",
    title: "Getting Started Is Simple",
    subtitle: "No downloads, no accounts to open. Just a form and a Zoom link.",
    items: [
      { title: "Fill in the form", body: "Tell us who you are and how you currently trade, if at all." },
      { title: "Join the Telegram community", body: "Get session resources and reminders from {{partnerName}}'s community." },
      { title: "Attend and ask", body: "Be there live, see the analysis and put your questions to the mentor." },
    ],
  },
  {
    eyebrow: "BEFORE THE SESSION",
    title: "From Sign-Up To Session",
    subtitle: "Here is exactly what happens once you claim your free pass.",
    items: [
      { title: "Reserve your pass", body: "Submit the short form to secure your free seat." },
      { title: "Prepare", body: "Review the session guide we send so you can follow along comfortably." },
      { title: "Learn live", body: "Take part in the masterclass and leave with a clearer trading plan." },
    ],
  },
];

/* ── Navbar / footer / meta ────────────────────────────────────────────────── */

const navbar: NavbarContent[] = [
  {
    ctaLabel: "Get Free Pass",
    links: {
      features: "What You'll Learn",
      steps: "How It Works",
      mentor: "About Mentor",
      offer: "What You Get",
      testimonials: "Reviews",
      faq: "FAQs",
    },
  },
  {
    ctaLabel: "Reserve My Seat",
    links: { features: "Curriculum", steps: "Process", mentor: "Your Mentor", offer: "Included", testimonials: "Feedback", faq: "Questions" },
  },
  {
    ctaLabel: "Join Free",
    links: { features: "Topics", steps: "Steps", mentor: "Mentor", offer: "Free Pass", testimonials: "Reviews", faq: "FAQ" },
  },
];

const footer: FooterContent[] = [
  { tagline: "Trading Education & Mentorship" },
  { tagline: "Free live trading education" },
  { tagline: "Price action and risk management, taught live" },
];

const meta: MetaContent[] = [
  { title: "{{partnerName}} - Free Trading Mentorship & Webinar", description: "{{tagline}}" },
  { title: "{{partnerName}} | Free Live Trading Masterclass", description: "Join {{partnerName}} for a free live masterclass on price action, risk management and trading psychology." },
  { title: "Free Trading Webinar With {{partnerName}}", description: "Reserve a free seat and learn how to read charts and manage risk, live on Zoom with {{partnerName}}." },
  { title: "Learn Price Action Live With {{partnerName}}", description: "A free, beginner-friendly live session covering market structure, entries and disciplined risk control." },
  { title: "{{partnerName}}: Free Live Class On Risk & Price Action", description: "Register free for a live trading class with chart breakdowns and a Q&A with {{partnerName}}." },
  { title: "{{brand}} | Free Live Trading Masterclass", description: "A practical, free masterclass with live chart walkthroughs and mentor Q&A." },
];

/* ── Mentor / stats ────────────────────────────────────────────────────────── */

const mentor: MentorContent[] = [
  {
    role: "Lead Market Mentor & Educator",
    badge: "Verified Technical Analyst",
    title: "Dedicated to Creating Disciplined, Independent Traders",
    body: "With over 8 years of active market experience across equities, commodities, and currencies, our approach is centered around risk mitigation, probabilistic edge, and realistic expectations. We reject overnight-wealth myths in favor of structured, sustainable trading habits.",
    ctaLabel: "Connect on Telegram Channel",
  },
  {
    role: "Your Live Session Mentor",
    badge: "Live Market Educator",
    title: "Teaching A Risk-First Way To Trade",
    body: "Sessions focus on structure, patience and realistic expectations. The goal is to help you make clearer decisions on your own, not to hand you signals.",
    ctaLabel: "Join The Telegram Community",
  },
  {
    role: "Trading Educator",
    badge: "Hands-on Teaching",
    title: "Learn By Watching Real Charts",
    body: "Instead of slides full of theory, every concept is shown on a live chart so you can see how the decision is made and why.",
    ctaLabel: "Follow On Telegram",
  },
];

const stats: StatsContent[] = [
  {
    items: [
      { end: 60000, suffix: "+", label: "Students Mentored" },
      { end: 4.9, decimals: 1, suffix: " / 5", label: "Average Learner Rating" },
      { end: 92, suffix: "%", label: "Positive Feedback Rate" },
      { text: "100%", label: "Free Live Access" },
    ],
  },
];

/* ── Testimonials (heading copy only; quotes are the partner's own) ────────── */

const testimonials: TestimonialsContent[] = [
  { eyebrow: "LEARNER FEEDBACK", title: "What Our Students Say", subtitle: "Words from people who attended a live session." },
  { eyebrow: "STUDENT VOICES", title: "Hear From Past Attendees", subtitle: "Honest feedback from learners who joined us live." },
  { eyebrow: "REVIEWS", title: "Why Learners Recommend The Session", subtitle: "A few notes shared by our community." },
  { eyebrow: "COMMUNITY", title: "Straight From The Community", subtitle: "What traders in our Telegram group say about the classes." },
  { eyebrow: "TESTIMONIALS", title: "Feedback From Real Learners", subtitle: "Shared with permission by the people who wrote them." },
  { eyebrow: "WORD OF MOUTH", title: "What Attendees Tell Us", subtitle: "Short notes after attending the live masterclass." },
];

/* ── Offer ─────────────────────────────────────────────────────────────────── */

const OFFER_ITEMS = [
  "Live Zoom masterclass with real chart analysis",
  "Interactive Q&A with the mentor",
  "Session resources and chart templates on Telegram",
  "Joining link and reminders on WhatsApp and email",
];

const offer: OfferContent[] = [
  {
    eyebrow: "YOUR FREE PASS",
    title: "Everything You Get With Your Free Pass",
    subtitle: "One short form unlocks the full live session and the community behind it.",
    priceLabel: "Free",
    priceNote: "No payment details needed",
    items: OFFER_ITEMS,
    ctaLabel: "Claim My Free Pass",
  },
  {
    eyebrow: "WHAT'S INCLUDED",
    title: "What's Included In The Masterclass",
    subtitle: "Everything is covered by your free registration.",
    priceLabel: "Free",
    priceNote: "Open to everyone",
    items: [...OFFER_ITEMS, "Follow-up resources in the Telegram community"],
    ctaLabel: "Reserve My Seat",
  },
  {
    eyebrow: "SESSION PASS",
    title: "Your Seat At The Live Class",
    subtitle: "Register once and you are set for the next session.",
    priceLabel: "Free",
    priceNote: "Seats are limited",
    items: OFFER_ITEMS,
    ctaLabel: "Get My Pass",
  },
  {
    eyebrow: "ACCESS",
    title: "Free Access, Real Value",
    subtitle: "No upsell is needed to attend the live session.",
    priceLabel: "Free",
    priceNote: "Takes about a minute to register",
    items: OFFER_ITEMS.slice(0, 3).concat("Reminders so you do not miss the start"),
    ctaLabel: "Join Free",
  },
];

/* ── FAQ ───────────────────────────────────────────────────────────────────── */

const faq: FaqContent[] = [
  {
    eyebrow: "GOT QUESTIONS?",
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about the free masterclass and live access.",
    // no `items`: the admin-editable FAQs from site settings are used
  },
  {
    eyebrow: "QUESTIONS",
    title: "Before You Register",
    subtitle: "Quick answers to what people ask us most.",
    items: [
      { q: "Is the masterclass really free?", a: "Yes. Registering and attending the live session does not cost anything." },
      { q: "Do I need trading experience?", a: "No. The session starts from the fundamentals and is suitable for beginners as well as traders who want more consistency." },
      { q: "How do I get the joining link?", a: "It is sent to your WhatsApp number and email as soon as you register." },
      { q: "Will I be able to ask questions?", a: "Yes. Time is set aside for a live Q&A so you can bring your own charts and doubts." },
      { q: "Is trading risky?", a: "Yes. Trading involves a real risk of loss. The session is educational and does not provide investment advice or promise returns." },
    ],
  },
  {
    eyebrow: "FAQ",
    title: "Your Questions, Answered",
    subtitle: "If something is missing, ask in the Telegram community.",
    items: [
      { q: "Who is this session for?", a: "Anyone curious about trading, from complete beginners to people who already trade but want a more structured approach." },
      { q: "What do I need to attend?", a: "A phone or computer with internet access and the Zoom app. No trading account is required." },
      { q: "What will I actually learn?", a: "How to read price action, plan trades with defined risk and keep your decisions disciplined." },
      { q: "Is there anything to buy afterwards?", a: "There is no obligation. You are free to attend the session and decide what to do next." },
    ],
  },
  {
    eyebrow: "GOOD TO KNOW",
    title: "Things People Ask Before Joining",
    subtitle: "Short, honest answers.",
    items: [
      { q: "How long is the session?", a: "Details of the schedule are shared in your confirmation message once you register." },
      { q: "Can I join from my phone?", a: "Yes. Zoom works on mobile, tablet and desktop." },
      { q: "What if I cannot attend live?", a: "Live attendance is encouraged. Follow-up resources are shared with registered participants in the community." },
      { q: "Are results guaranteed?", a: "No. Markets carry risk and nothing taught here guarantees profit. The aim is better understanding and discipline." },
      { q: "Where do I find the community?", a: "A link to the Telegram community is shown right after you register." },
    ],
  },
  {
    eyebrow: "HELP",
    title: "Frequently Asked, Briefly Answered",
    subtitle: "Everything most people want to know first.",
    items: [
      { q: "Do I have to pay anything?", a: "No. The live masterclass is free to attend." },
      { q: "Will this make me a profitable trader?", a: "No class can promise that. You will learn tools for analysing charts and managing risk, and applying them takes practice." },
      { q: "Do I need to prepare?", a: "Nothing special. We send a short guide so you can follow along comfortably." },
      { q: "Can I ask about my own trades?", a: "Yes, bring your questions to the live Q&A." },
    ],
  },
];

/* ── CTA ───────────────────────────────────────────────────────────────────── */

const cta: CtaContent[] = [
  {
    eyebrow: "RESERVE YOUR FREE SPOT",
    title: "Ready to Level Up Your Trading Game?",
    body: "Seats for the live Zoom room are strictly limited to maintain high audio/video clarity and interactive Q&A. Claim your pass now before registration closes.",
    button: "Claim My Free Pass Now",
  },
  {
    eyebrow: "JOIN THE LIVE CLASS",
    title: "Take The First Step Today",
    body: "Reserve your free seat and get your joining details on WhatsApp and email within moments.",
    button: "Reserve My Free Seat",
  },
  {
    eyebrow: "LIMITED SEATS",
    title: "Your Seat Is Waiting",
    body: "The live room is kept small so everyone can follow the charts and ask questions. Register now to hold your place.",
    button: "Save My Spot",
  },
  {
    eyebrow: "FREE MASTERCLASS",
    title: "Learn To Trade With A Clear Plan",
    body: "Join {{partnerName}} live and leave with a framework for analysing charts and managing risk.",
    button: "Get My Free Pass",
  },
  {
    eyebrow: "DON'T MISS OUT",
    title: "Start Building Better Trading Habits",
    body: "It takes a minute to register and nothing to attend. Bring your questions.",
    button: "Register Free Now",
  },
];

export const CONTENT_POOLS: ContentPools = {
  navbar: pool("navbar", navbar),
  hero: pool("hero", hero),
  features: pool("features", features),
  steps: pool("steps", steps),
  mentor: pool("mentor", mentor),
  stats: pool("stats", stats),
  testimonials: pool("testimonials", testimonials),
  offer: pool("offer", offer),
  faq: pool("faq", faq),
  cta: pool("cta", cta),
  footer: pool("footer", footer),
  meta: pool("meta", meta),
};
