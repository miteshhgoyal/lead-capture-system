import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { PartnerShell } from "@/components/partner/PartnerShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { default: "Partner Portal", template: "%s | Partner Portal" },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const partner = await getPartnerSession();
  if (!partner) redirect("/partner/login");

  return (
    <PartnerShell partner={{ name: partner.name, slug: partner.slug, logoUrl: partner.logoUrl, loginId: partner.loginId }}>
      {children}
    </PartnerShell>
  );
}
