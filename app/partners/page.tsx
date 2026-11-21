import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { getReadableTextColor } from "@/lib/theme-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Partners",
  description: "Meet the mentors and partners hosting free live trading masterclasses.",
};

interface Row {
  _id: { toString(): string };
  name: string;
  slug: string;
  logoUrl?: string;
  tagline?: string;
  theme?: { primaryColor?: string };
}

async function loadPartners(): Promise<Row[]> {
  try {
    await dbConnect();
    return await Partner.find({ isActive: true })
      .select("name slug logoUrl tagline theme.primaryColor")
      .sort({ createdAt: -1 })
      .lean<Row[]>();
  } catch (e) {
    console.error("[partners list]", e);
    return [];
  }
}

export default async function PartnersPage() {
  const partners = await loadPartners();

  return (
    <main className="min-h-screen bg-bg text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight">Free Course Link</Link>
        <div className="flex items-center gap-2">
          <Link href="/partner/login" className="rounded-xl border border-hairline px-3.5 py-2 text-sm font-semibold hover:bg-card">Partner login</Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-6 pt-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Our Partners</h1>
        <p className="mx-auto mt-3 max-w-2xl text-mute">Pick a mentor and join their free live trading masterclass.</p>
        <Link href="/partners/join" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-accent-ink">
          <UserPlus className="size-4" aria-hidden /> Become a partner
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        {partners.length === 0 ? (
          <p className="rounded-2xl border border-hairline bg-card p-10 text-center text-mute">No partners yet. Be the first to join.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((p) => {
              const color = p.theme?.primaryColor || "#3b36e0";
              return (
                <li key={p._id.toString()}>
                  <Link
                    href={`/${p.slug}`}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-hairline bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      {p.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logoUrl} alt="" className="size-14 rounded-xl border border-hairline bg-bg object-contain p-1" />
                      ) : (
                        <div className="flex size-14 items-center justify-center rounded-xl text-xl font-bold" style={{ backgroundColor: color, color: getReadableTextColor(color) }}>
                          {p.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <h2 className="text-lg font-bold leading-tight">{p.name}</h2>
                    </div>
                    {p.tagline && <p className="line-clamp-3 text-sm text-mute">{p.tagline}</p>}
                    <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold" style={{ color }}>
                      View page <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
