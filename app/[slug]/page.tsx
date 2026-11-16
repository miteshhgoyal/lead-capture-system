import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Partner, type IPartner } from "@/lib/models/Partner";
import { getSettings } from "@/lib/settings";
import { isReservedSlug } from "@/lib/validation/partner";
import { generatePartnerThemeCss } from "@/lib/theme-utils";
import { LandingPage } from "@/components/landing/LandingPage";

interface PartnerPageProps {
  params: Promise<{ slug: string }>;
}

async function getPartnerData(slugParam: string): Promise<IPartner | null> {
  const slug = (slugParam || "").toLowerCase().trim();
  if (isReservedSlug(slug)) return null;

  try {
    await dbConnect();
    const partner = await Partner.findOne({ slug, isActive: true }).lean<IPartner | null>();
    return partner;
  } catch (error) {
    console.error("[getPartnerData] Error fetching partner:", error);
    return null;
  }
}

export async function generateMetadata(props: PartnerPageProps): Promise<Metadata> {
  const params = await props.params;
  const partner = await getPartnerData(params.slug);
  const settings = await getSettings();

  if (!partner) {
    return {
      title: "Partner Page Not Found",
    };
  }

  const title = `${partner.name} - Free Trading Mentorship & Webinar`;
  const description = partner.tagline || settings.subheadline;
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
  const partner = await getPartnerData(params.slug);
  const settings = await getSettings();

  if (!partner) {
    notFound();
  }

  const themeCss = generatePartnerThemeCss(partner.theme);

  return (
    <>
      {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      <LandingPage
        partner={{
          ...partner,
          _id: partner._id,
        }}
        settings={settings}
        isCustomPartner={true}
      />
    </>
  );
}
