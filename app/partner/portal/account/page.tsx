import type { Metadata } from "next";
import { getPartnerSession } from "@/lib/partner-auth";
import { Card, PageHeader } from "@/components/admin/AdminPrimitives";
import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const p = (await getPartnerSession())!;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Account" description="Your sign-in details." />
      <Card>
        <p className="text-label font-semibold uppercase tracking-wider text-mute">Login ID</p>
        <p className="mt-1 font-mono text-cell text-ink">{p.loginId || "Not set. Ask the admin."}</p>
      </Card>
      <PasswordForm />
    </div>
  );
}
