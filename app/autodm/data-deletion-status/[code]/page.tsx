import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { deletionStatus } from "@/autodm/compliance";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Data deletion status", robots: { index: false, follow: false } };

/** Public status page for Meta data-deletion requests. Always available, even when AutoDM is switched off. */
export default async function DeletionStatusPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await deletionStatus(code).catch(() => ({ found: false as const }));
  return (
    <LegalPage title="Data deletion status">
      {!s.found ? <p>We could not find a deletion request with this confirmation code.</p> : (
        <>
          <p><strong>Confirmation code:</strong> <code>{code}</code></p>
          <p><strong>Status:</strong> {s.status === "done" ? "Completed. The data tied to this request has been deleted." : "Received. Deletion is in progress and normally finishes within a few minutes."}</p>
        </>
      )}
    </LegalPage>
  );
}
