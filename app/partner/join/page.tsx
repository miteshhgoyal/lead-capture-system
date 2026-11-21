import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPartnerSession } from "@/lib/partner-auth";
import { getSettings } from "@/lib/settings";
import { PartnerSignupForm } from "@/components/partner/PartnerSignupForm";
import { ThemeToggle } from "@/components/landing/ThemeToggle";

export const metadata: Metadata = { title: "Become a Partner", description: "Create your own lead page in a minute and earn a share of the revenue your leads bring in." };
export const dynamic = "force-dynamic";

/** Direct sign-up link for partners (same form as the hero on `/`). */
export default async function PartnerJoinPage() {
  if (await getPartnerSession()) redirect("/partner/portal");
  const settings = await getSettings();

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt={settings.brandName} className="h-8 w-auto max-w-[160px] object-contain" />
          ) : (
            settings.brandName
          )}
        </Link>
        <ThemeToggle />
      </header>
      <div className="mx-auto max-w-xl px-4 pb-20 pt-4">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Capture leads. Earn on the revenue.</h1>
          <p className="mt-3 text-mute">Create your page in a minute and earn a share of the revenue your leads bring in.</p>
        </div>
        <PartnerSignupForm />
      </div>
    </main>
  );
}
