import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { AdminConsole } from "@/autodm/ui/AdminConsole";

export const metadata: Metadata = { title: "AutoDM" };

export default function AdminAutoDmPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="AutoDM" description="Instagram / Facebook comment and DM automation: feature switches, readiness, accounts, logs and limits." />
      <AdminConsole />
    </div>
  );
}
