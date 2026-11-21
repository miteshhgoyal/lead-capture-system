import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { autodmVisibleTo } from "@/autodm/settings-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, title: { default: "AutoDM", template: "%s | AutoDM" } };

/** User area. With the master switch off (or the user not allowed) these pages do not exist: 404. */
export default async function AutoDmLayout({ children }: { children: React.ReactNode }) {
  const partner = await getPartnerSession();
  if (!partner) redirect("/partner/login");
  if (!(await autodmVisibleTo(String(partner._id)))) notFound();
  return (
    <PartnerShell partner={{ name: partner.name, slug: partner.slug, logoUrl: partner.logoUrl, loginId: partner.loginId }} autodm>
      <div className="mx-auto max-w-6xl">{children}</div>
    </PartnerShell>
  );
}
