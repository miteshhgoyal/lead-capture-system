import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/AdminPrimitives";
import { PaymentsClient } from "./PaymentsClient";

export const metadata: Metadata = { title: "Partner Payments" };

export default function AdminPaymentsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Partner Payments" description="Every payment from the Sales CRM that came from a partner's lead: who paid, how much, when, and through which partner." />
      <PaymentsClient />
    </div>
  );
}
