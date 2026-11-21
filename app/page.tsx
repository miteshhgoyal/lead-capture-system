import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getRootPage } from "@/lib/page-builder/persist";
import { generateProgramPage, isProgramPage, PROGRAM_CONTENT } from "@/lib/page-builder/program";
import { LandingPage } from "@/components/landing/LandingPage";

export const dynamic = "force-dynamic";

/**
 * `/` is the Partner Program page: pitch + partner sign-up form in the hero.
 * Admin controls it from Settings: logo, brand colour and "Shuffle page" (layout, theme, section order).
 * A page saved here before the program existed (trading copy) is ignored until the admin shuffles once.
 */
async function loadPlan() {
  const saved = await getRootPage();
  return saved && isProgramPage(saved) ? saved : generateProgramPage({ legacy: true, seed: 0 });
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const { title, description } = PROGRAM_CONTENT.meta;
  return {
    title: { absolute: `${settings.brandName}: ${title}` },
    description,
    openGraph: { title, description, type: "website", images: settings.logoUrl ? [{ url: settings.logoUrl }] : [] },
  };
}

export default async function HomePage() {
  const [settings, page] = await Promise.all([getSettings(), loadPlan()]);
  return <LandingPage settings={settings} isCustomPartner={false} page={page} formMode="partner" />;
}
