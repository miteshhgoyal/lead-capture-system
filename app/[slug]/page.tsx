import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Partner, type IPartner } from "@/lib/models/Partner";
import { getSettings } from "@/lib/settings";
import { isReservedSlug } from "@/lib/validation/partner";
import { ensurePartnerPage } from "@/lib/page-builder/persist";
import { resolvePage, type PartnerView } from "@/components/landing/page-context";
import { LandingPage } from "@/components/landing/LandingPage";
import { resolveMeta } from "@/lib/page-builder/resolve";

interface PartnerPageProps {
  params: Promise<{ slug: string }>;
}

/** Partner + its saved page, loaded once per request (shared by metadata and the page body). */
const getPartnerPage = cache(async (slugParam: string) => {
  const slug = (slugParam || "").toLowerCase().trim();
  if (isReservedSlug(slug)) return null;

  try {
    await dbConnect();
    const partner = await Partner.findOne({ slug, isActive: true }).lean<IPartner | null>();
    if (!partner) return null;
    // Reads the saved config; generates and saves one only if this partner has none yet.
    const page = await ensurePartnerPage(partner);
    return { partner, page };
  } catch (error) {
    console.error("[getPartnerPage] Error loading partner page:", error);
    return null;
  }
});

function toPartnerView(partner: IPartner): PartnerView {
  return {
    name: partner.name,
    slug: partner.slug,
    telegramLink: partner.telegramLink,
    whatsappLink: partner.whatsappGroupLink,
    tagline: partner.tagline,
    mentorBio: partner.mentorBio,
    logoUrl: partner.logoUrl,
    theme: { primaryColor: partner.theme?.primaryColor },
    testimonials: (partner.testimonials ?? []).map((t) => ({ name: t.name, role: t.role, quote: t.quote })),
  };
}

export async function generateMetadata(props: PartnerPageProps): Promise<Metadata> {
  const params = await props.params;
  const data = await getPartnerPage(params.slug);
  const settings = await getSettings();

  if (!data) {
    return {
      title: "Partner Page Not Found",
    };
  }

  const { partner, page } = data;
  const { vars } = resolvePage({ partner: toPartnerView(partner), settings, isCustomPartner: true, plan: page });
  const { title, description } = resolveMeta(page.contentConfig.meta, vars, partner.tagline);
  const images = partner.logoUrl ? [{ url: partner.logoUrl }] : settings.logoUrl ? [{ url: settings.logoUrl }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function PartnerPage(props: PartnerPageProps) {
  const params = await props.params;
  const data = await getPartnerPage(params.slug);
  const settings = await getSettings();

  if (!data) {
    notFound();
  }

  return <LandingPage partner={toPartnerView(data.partner)} settings={settings} isCustomPartner page={data.page} />;
}
