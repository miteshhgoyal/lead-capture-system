import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Data Deletion Instructions" };

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion Instructions" updated="November 2026">
      <p>You can ask us to delete the data we hold about you from Instagram or Facebook (AutoDM) at any time.</p>

      <h2>Option 1: remove the app on Instagram or Facebook</h2>
      <ul>
        <li>Instagram: Settings, then Website permissions (Apps and websites), find Free Course Link and choose Remove.</li>
        <li>Facebook: Settings, then Apps and Websites, find Free Course Link and choose Remove.</li>
      </ul>
      <p>When you remove the app, Meta notifies us and we automatically delete the data linked to your account (leads, conversations, messages and stored tokens). You will receive a confirmation code, and you can check progress at <code>/autodm/data-deletion-status/&lt;your code&gt;</code>.</p>

      <h2>Option 2: ask us directly</h2>
      <p>Send a request through our <a href="/contact">contact page</a> with your Instagram or Facebook username. We will verify the request and delete the data within 30 days.</p>

      <h2>What is deleted</h2>
      <ul>
        <li>Your connected account record and access token</li>
        <li>Leads, conversations and message text linked to you</li>
        <li>Identifiers in automation run logs (the counts we keep are anonymous)</li>
      </ul>
    </LegalPage>
  );
}
