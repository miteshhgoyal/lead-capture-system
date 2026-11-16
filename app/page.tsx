import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { LandingPage } from "@/components/landing/LandingPage";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `${settings.brandName} - Free Live Trading Masterclass`,
    description: settings.subheadline,
    openGraph: {
      title: `${settings.brandName} - Free Live Trading Masterclass`,
      description: settings.subheadline,
      type: "website",
      images: settings.logoUrl ? [{ url: settings.logoUrl }] : [],
    },
  };
}

export default async function HomePage() {
  const settings = await getSettings();
  return <LandingPage settings={settings} isCustomPartner={false} />;
}
