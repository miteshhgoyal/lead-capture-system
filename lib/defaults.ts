export interface ThemeTone {
  accent: string;
  accent2: string;
  accentInk: string;
}

export interface SiteSettingsData {
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
  faqs: { q: string; a: string }[];
  disclaimer: string;
  analytics?: {
    metaPixelId?: string;
    gaMeasurementId?: string;
  };
}

export const DEFAULT_SETTINGS: SiteSettingsData = {
  headline: "Master High-Probability Trading With Live Mentorship",
  subheadline:
    "Actionable price action, disciplined risk management, and live market execution — completely free exclusive webinar.",
  trustLine: "100% Free · Join 60,000+ Enrolled Students",
  defaultTelegramLink: "https://t.me/onestockacademy",
  defaultWhatsappLink: "",
  defaultZoomLink: "",
  defaultMentorName: "OneStock Trading Academy",
  defaultMentorBio:
    "Senior institutional traders and certified technical analysts sharing real-world market strategies with over 60,000 students worldwide.",
  brandName: "OneStock Academy",
  brandTagline: "Zero To Profitable Trader",
  logoUrl: "/tp-logo-light.png",
  faqs: [
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
  disclaimer:
    "Trading financial instruments involves significant risk of loss and is not suitable for everyone. All content provided is strictly for educational and informational purposes only. No guaranteed returns or investment advice.",
  analytics: {
    metaPixelId: "",
    gaMeasurementId: "",
  },
};
