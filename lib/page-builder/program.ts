/**
 * Content for the root page (`/`): the Partner Program pitch.
 *
 * It reuses the landing page sections, layout variants, themes and the shuffler: only the copy is
 * different. Every id starts with `program_`, which is how the root page tells a saved program page
 * from an old trading-masterclass page that was saved on `/` before.
 */
import { generatePartnerPage, type GenerateOptions } from "./generate";
import type { ContentConfig, PartnerPageConfig, SectionKey } from "./types";

export const PROGRAM_PREFIX = "program_";

export const PROGRAM_CONTENT: ContentConfig = {
  navbar: {
    id: "program_navbar",
    ctaLabel: "Become a Partner",
    links: {
      features: "Benefits",
      steps: "How it works",
      mentor: "About",
      offer: "Earnings",
      testimonials: "Reviews",
      faq: "FAQ",
    },
  },
  hero: {
    id: "program_hero",
    badge: "Partner Program · Free to join",
    headline: "Capture leads. Earn when they turn into revenue.",
    subheadline:
      "Get your own branded landing page in a minute. Share it, collect leads, and earn a share of the revenue your leads bring to {{brand}}. Track everything live in your own partner portal.",
    mobileCta: "Become a partner",
    highlights: [
      { icon: "users", title: "Your own lead page", body: "Your logo, your colours, your link" },
      { icon: "chart", title: "Live partner portal", body: "Leads, revenue and your share in one place" },
      { icon: "gift", title: "Revenue share", body: "Earn when your leads become customers" },
      { icon: "lock", title: "Privacy built in", body: "Lead contact details stay masked" },
    ],
  },
  features: {
    id: "program_features",
    eyebrow: "WHY PARTNER WITH US",
    title: "Everything you need to turn traffic into earnings",
    subtitle: "No tech setup, no ad spend rules, no fine print. Sign up, share your link and watch your numbers grow.",
    items: [
      { icon: "zap", title: "Live in a minute", body: "Pick your name, upload a logo and choose a colour. Your page is published the moment you sign up." },
      { icon: "badge", title: "Looks like you", body: "Your brand, your tagline and your community links. Shuffle the layout any time for a fresh look." },
      { icon: "chart", title: "Revenue you can see", body: "Your portal matches your leads with real payments, so you see exactly what they brought in and what you earned." },
      { icon: "lock", title: "Safe by design", body: "Lead phone numbers and emails are masked in your portal and exports. You get the numbers, we protect the people." },
    ],
  },
  steps: {
    id: "program_steps",
    eyebrow: "HOW IT WORKS",
    title: "Start earning in three steps",
    subtitle: "From sign-up to your first tracked lead in minutes.",
    items: [
      { title: "Create your partner page", body: "Fill in a short form with your name, login, community link and brand colour. Your page goes live instantly." },
      { title: "Share your link", body: "Post it on social media, in your community or to your audience. Every sign-up is tagged to you automatically." },
      { title: "Earn on the revenue", body: "When your leads turn into paying customers, the revenue shows up in your portal along with your share of it." },
    ],
  },
  mentor: {
    id: "program_mentor",
    role: "Partner Program",
    badge: "Built for creators",
    title: "Built for people with an audience",
    body: "If you teach, mentor or simply have a community that wants to learn trading, this program gives you a page and a dashboard without any setup.",
    ctaLabel: "Become a partner",
  },
  stats: {
    id: "program_stats",
    items: [
      { text: "₹0", label: "Cost to join" },
      { text: "1 min", label: "To launch your page" },
      { text: "Live", label: "Lead and revenue tracking" },
      { text: "Shuffle", label: "Fresh layout any time" },
    ],
  },
  testimonials: {
    id: "program_testimonials",
    eyebrow: "PARTNERS",
    title: "What partners say",
    subtitle: "",
  },
  offer: {
    id: "program_offer",
    eyebrow: "YOUR EARNINGS",
    title: "A share of every rupee your leads bring in",
    subtitle: "Your revenue share is set for your account and shown live in your portal, next to the revenue it comes from.",
    priceLabel: "Free to join",
    priceNote: "No fees. No minimums.",
    items: [
      "Your own branded landing page and public link",
      "A partner portal with live lead and revenue numbers",
      "Revenue share on leads that become customers",
      "Filters, exports and masked contact details",
      "Shuffle your page layout whenever you like",
    ],
    ctaLabel: "Create my partner page",
  },
  faq: {
    id: "program_faq",
    eyebrow: "QUESTIONS",
    title: "Partner program FAQ",
    subtitle: "Quick answers before you sign up.",
    items: [
      { q: "Does it cost anything to join?", a: "No. Creating your partner page and using the portal is free." },
      { q: "How do I earn?", a: "Leads who sign up through your link are matched with payments made to the company. You earn a revenue share on the revenue those leads bring in. Your share and the revenue behind it are shown in your portal." },
      { q: "Who decides my share?", a: "The admin team sets the business share for each partner. You can see yours in your portal at any time." },
      { q: "Can I see my leads?", a: "Yes. Your portal lists every lead from your link with filters and export. Phone numbers and emails are masked to protect the people who signed up." },
      { q: "Can I change my page later?", a: "Yes. Change your name, logo, colour and links from the portal, and shuffle the layout whenever you want a fresh look." },
    ],
  },
  cta: {
    id: "program_cta",
    eyebrow: "READY WHEN YOU ARE",
    title: "Start capturing leads today",
    body: "Create your partner page in a minute and share your link. Your first tracked lead could be today.",
    button: "Become a partner",
  },
  footer: {
    id: "program_footer",
    tagline: "{{brand}} Partner Program: capture leads, earn on the revenue they bring.",
  },
  meta: {
    id: "program_meta",
    title: "Partner Program: capture leads and earn a revenue share",
    description:
      "Create your own branded landing page in a minute, capture leads, and earn a share of the revenue they bring in. Track everything live in your partner portal.",
  },
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Sections that make no sense on the program page (they need a mentor profile or partner reviews). */
const HIDDEN: SectionKey[] = ["mentor", "testimonials"];

/**
 * A root-page plan: shuffled layouts, theme and section order (same shuffler as partner pages)
 * with the Partner Program copy. `legacy` gives the plain default: variant 1 everywhere.
 */
export function generateProgramPage(options: GenerateOptions = {}): PartnerPageConfig {
  const base = generatePartnerPage({}, options);
  return {
    ...base,
    contentConfig: clone(PROGRAM_CONTENT),
    sectionOrder: base.sectionOrder.filter((k) => !HIDDEN.includes(k)),
  };
}

/** True when a stored root page carries the program copy (older saved pages are trading copy). */
export const isProgramPage = (page: { contentConfig?: { hero?: { id?: string } } } | null | undefined): boolean =>
  Boolean(page?.contentConfig?.hero?.id?.startsWith(PROGRAM_PREFIX));
