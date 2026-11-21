import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { LeadsClient } from "./LeadsClient";

export const metadata: Metadata = { title: "My Leads" };

export default function PartnerLeadsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="My Leads" description="Everyone who signed up through your link. Email and phone are masked." />
      <LeadsClient />
    </div>
  );
}
