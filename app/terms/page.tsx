import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 2026">
      <p>By using Free Course Link, including the Partner Program and AutoDM, you agree to these terms.</p>

      <h2>Using the service</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure.</li>
        <li>You are responsible for everything done through your account.</li>
        <li>We may suspend accounts that break these terms or the rules of the platforms we connect to.</li>
      </ul>

      <h2>AutoDM terms</h2>
      <ul>
        <li><strong>You are responsible for your message content.</strong> Messages must be accurate, lawful and not misleading.</li>
        <li><strong>No spam.</strong> AutoDM only replies to people who interacted with your account first. You must not use it to send unsolicited, bulk or repeated messages, or to harass anyone.</li>
        <li><strong>Platform rules.</strong> You must follow Meta&rsquo;s Platform Terms, the Instagram Terms of Use and Community Guidelines, and Messenger/Instagram messaging policies, including the 24-hour reply window and the one-private-reply-per-comment rule. Only Instagram Professional accounts can be connected.</li>
        <li><strong>Your account.</strong> You may only connect accounts you own or are authorised to manage. You can disconnect at any time.</li>
        <li><strong>Availability.</strong> Features may be limited, paused or removed at any time, for example to comply with platform rules or protect users. Delivery of messages depends on Meta and is not guaranteed.</li>
        <li><strong>Data.</strong> You must handle the leads and contact details you receive lawfully and in line with our <a href="/privacy">Privacy Policy</a>.</li>
      </ul>

      <h2>Partner revenue share</h2>
      <p>Where a revenue share applies, it is set by the administrator and calculated on verified payments from leads attributed to your page. Figures shown in the portal are informational until settled.</p>

      <h2>Liability</h2>
      <p>The service is provided &ldquo;as is&rdquo;. To the extent permitted by law we are not liable for indirect losses, including lost reach or sales caused by changes in third-party platforms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: see our <a href="/contact">contact page</a>.</p>
    </LegalPage>
  );
}
