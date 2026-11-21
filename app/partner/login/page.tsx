import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { PartnerLoginForm } from "./PartnerLoginForm";

export const metadata: Metadata = { title: "Partner Login", robots: { index: false, follow: false } };

export default async function PartnerLoginPage() {
  if (await getPartnerSession()) redirect("/partner/portal");
  return <PartnerLoginForm />;
}
