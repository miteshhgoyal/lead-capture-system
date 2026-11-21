import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const email = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();
  return (
    <LegalPage title="Contact">
      <p>For support, privacy questions, data deletion requests or partner enquiries, reach out to us:</p>
      {email ? <p><a href={`mailto:${email}`}>{email}</a></p> : <p>Partners can reach us from the partner portal; everyone else can reply to any email we have sent you.</p>}
      <p>Please include your Instagram or Facebook username for data requests so we can find your records.</p>
    </LegalPage>
  );
}
