import type { Metadata } from "next";
import { getPartnerSession } from "@/lib/partner-auth";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { ShareLinkCard } from "../PortalClient";
import { MyPageForm } from "./MyPageForm";

export const metadata: Metadata = { title: "My Page" };
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const p = (await getPartnerSession())!;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="My Page" description="Your public landing page: name, logo, colour and links." />
      <ShareLinkCard slug={p.slug} />
      <MyPageForm
        initial={{
          name: p.name,
          telegramLink: p.telegramLink,
          whatsappGroupLink: p.whatsappGroupLink ?? "",
          tagline: p.tagline ?? "",
          mentorBio: p.mentorBio ?? "",
          logoUrl: p.logoUrl ?? "",
          primaryColor: p.theme?.primaryColor ?? "#3b36e0",
        }}
      />
    </div>
  );
}
