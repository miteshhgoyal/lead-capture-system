import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/components/theme-mode";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freecourselink.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  title: { default: "Free Course Link - Free Live Trading Masterclass", template: "%s | Free Course Link" },
  description: "Master high-probability price action trading, disciplined risk management, and live chart execution. 100% Free webinar.",
  openGraph: {
    title: "Free Course Link - Free Live Trading Masterclass",
    description: "Master high-probability price action trading, disciplined risk management, and live chart execution. 100% Free webinar.",
    type: "website",
    url: SITE_URL,
    siteName: "Free Course Link",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Course Link - Free Live Trading Masterclass",
    description: "Master high-probability price action trading, disciplined risk management, and live chart execution. 100% Free webinar.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <head>
        {/* Sets the dark class before first paint (no theme flash); React never re-renders it. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
