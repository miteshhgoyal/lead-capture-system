import { Schema, model, models, type Model } from "mongoose";
import type { ContentConfig, LayoutConfig, SectionKey, ThemeConfig } from "../page-builder/types";

export interface ISiteSettings {
  key: "main";
  headline: string;
  subheadline: string;
  trustLine: string;
  defaultTelegramLink: string;
  defaultWhatsappLink?: string;
  defaultZoomLink?: string;
  defaultMentorName: string;
  defaultMentorBio: string;
  brandName: string;
  brandTagline: string;
  logoUrl?: string;
  /** Single brand colour for the root page (empty = the original palette). */
  primaryColor?: string;
  layoutConfig?: LayoutConfig | null;
  contentConfig?: ContentConfig | null;
  themeConfig?: ThemeConfig | null;
  sectionOrder?: SectionKey[] | null;
  seed?: number | null;
  faqs: { q: string; a: string }[];
  disclaimer: string;
  analytics?: {
    metaPixelId?: string;
    gaMeasurementId?: string;
  };
  updatedAt: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    headline: {
      type: String,
      default: "Master High-Probability Trading With Live Mentorship",
    },
    subheadline: {
      type: String,
      default:
        "Actionable price action, disciplined risk management, and live market execution — completely free exclusive webinar.",
    },
    trustLine: {
      type: String,
      default: "100% Free · Join 60,000+ Enrolled Students",
    },
    defaultTelegramLink: {
      type: String,
      default: "https://t.me/onestockacademy",
    },
    defaultWhatsappLink: { type: String, default: "" },
    defaultZoomLink: { type: String, default: "" },
    defaultMentorName: { type: String, default: "OneStock Trading Academy" },
    defaultMentorBio: {
      type: String,
      default:
        "Senior institutional traders and certified technical analysts sharing real-world market strategies with over 60,000 students worldwide.",
    },
    brandName: { type: String, default: "Free Course Link" },
    brandTagline: { type: String, default: "Zero To Profitable Trader" },
    logoUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "" },
    layoutConfig: { type: Schema.Types.Mixed, default: null },
    contentConfig: { type: Schema.Types.Mixed, default: null },
    themeConfig: { type: Schema.Types.Mixed, default: null },
    sectionOrder: { type: Schema.Types.Mixed, default: null },
    seed: { type: Number, default: null },
    faqs: {
      type: [
        {
          q: { type: String, required: true },
          a: { type: String, required: true },
        },
      ],
      default: [
        {
          q: "Is this trading masterclass really 100% free?",
          a: "Yes, 100% free with no hidden fees or charges. Our mission is to promote structured financial literacy and disciplined risk management across India and globally.",
        },
        {
          q: "Do I need prior trading experience to attend?",
          a: "Not at all. We start from foundational chart mechanics and build up to professional price action, making it suitable for both beginners and experienced traders struggling with consistency.",
        },
        {
          q: "How will I receive the Zoom meeting link?",
          a: "Immediately upon submitting your details, you will receive confirmation and the Zoom meeting link directly on your WhatsApp number and via email.",
        },
        {
          q: "Will there be a live Q&A session with the mentor?",
          a: "Yes! At the end of the masterclass, we host a dedicated 30-minute live interactive Q&A where you can get your charts and queries analyzed live.",
        },
        {
          q: "Can I watch a recording if I miss the live session?",
          a: "Live attendance is strongly encouraged for interactive chart walkthroughs, but registered participants will receive exclusive follow-up resources in the official Telegram community.",
        },
      ],
    },
    disclaimer: {
      type: String,
      default:
        "Trading financial instruments involves significant risk of loss and is not suitable for everyone. All content provided is strictly for educational and informational purposes only. No guaranteed returns or investment advice.",
    },
    analytics: {
      metaPixelId: { type: String, default: "" },
      gaMeasurementId: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSettings: Model<ISiteSettings> =
  (models.SiteSettings as Model<ISiteSettings> | undefined) ??
  model<ISiteSettings>("SiteSettings", siteSettingsSchema);
