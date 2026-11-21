import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 2026">
      <p>This policy explains what personal information Free Course Link (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, why, and the choices you have. It covers our landing pages, the Partner Program and the AutoDM feature.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Landing page sign-ups:</strong> name, phone number, email address and the answers you give on the form, plus technical data such as device type, referrer and campaign parameters.</li>
        <li><strong>Partners:</strong> brand name, login ID, a hashed password, links you provide (Telegram, WhatsApp), and the logo you upload.</li>
      </ul>

      <h2>AutoDM (Instagram and Facebook) data</h2>
      <p>AutoDM lets partners reply automatically to people who comment on their posts, reply to or mention them in stories, or message them. It uses Meta&rsquo;s official Instagram Platform and Graph APIs only.</p>
      <ul>
        <li><strong>From a partner who connects an account:</strong> the Instagram/Facebook account id, username, profile name and picture, account type, and an access token. Tokens are encrypted at rest and are never shown or logged.</li>
        <li><strong>From people who interact with a connected account:</strong> their app-scoped user id, username (when Meta provides it), the text of the comment or message that triggered a reply, the reply we sent, timestamps, and, only if they choose to send it, an email address.</li>
        <li>We never message anyone who has not first commented, replied to a story, mentioned the account in a story, or sent a message. We do not send bulk or cold messages.</li>
      </ul>
      <p><strong>How we use it:</strong> to send the reply the partner configured, to show the partner their leads, conversations and analytics, to prevent duplicate or abusive messages, and to keep the service secure.</p>
      <p><strong>Retention:</strong> raw webhook payloads are deleted after 30 days and message text after 180 days by default; aggregated counts are kept. Disconnecting an account deletes its token immediately.</p>
      <p><strong>Sharing:</strong> data is shared only with Meta (to deliver messages) and the infrastructure providers that host this service. We do not sell personal data.</p>

      <h2>Your choices and deletion</h2>
      <p>You can remove our access in your Instagram or Facebook settings (Apps and websites), which triggers automatic deletion of the data linked to your account. You can also follow the steps on our <a href="/data-deletion">data deletion page</a> or <a href="/contact">contact us</a>.</p>

      <h2>Security</h2>
      <p>We use encrypted connections, hashed passwords, encrypted access tokens, signed webhooks and access controls. No system is perfectly secure, but we work to protect your data.</p>

      <h2>Changes</h2>
      <p>We may update this policy and will change the date above when we do.</p>
    </LegalPage>
  );
}
