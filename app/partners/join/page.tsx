import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Become a Partner", description: "Create your own free masterclass landing page in a minute." };

export default async function JoinPage() {
  if (await getPartnerSession()) redirect("/partner/portal");
  return <JoinForm />;
}
