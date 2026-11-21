import Link from "next/link";
import { AlertTriangle, IndianRupee, Percent, TrendingUp, UserCheck, Users, CalendarDays, CalendarRange } from "lucide-react";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { getPartnerSession } from "@/lib/partner-auth";
import { getPartnerRevenue, partnerLeadMatch, shareOf } from "@/lib/partner-revenue";
import { maskEmail, maskPhone } from "@/lib/mask";
import { compactINR, formatINR } from "@/lib/format";
import { Badge, Card, PageHeader, StatTile } from "@/components/admin/AdminPrimitives";
import { ShareLinkCard } from "./PortalClient";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; variant: "accent" | "up" | "down" | "mute" }> = {
  new: { label: "New", variant: "accent" },
  contacted: { label: "Contacted", variant: "mute" },
  joined: { label: "Joined", variant: "up" },
  "not-interested": { label: "Not interested", variant: "down" },
};

export default async function PartnerDashboardPage() {
  const partner = (await getPartnerSession())!; // layout already redirects when signed out
  await dbConnect();

  const match = partnerLeadMatch(partner) as never;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [revenue, total, today, week, recent] = await Promise.all([
    getPartnerRevenue(partner),
    Lead.countDocuments(match),
    Lead.countDocuments({ $and: [match, { createdAt: { $gte: startOfToday } }] } as never),
    Lead.countDocuments({ $and: [match, { createdAt: { $gte: weekAgo } }] } as never),
    Lead.find(match).select("name phone email status createdAt").sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const percent = partner.sharePercent ?? 0;
  const share = shareOf(revenue.totalRevenue, percent);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={`Welcome, ${partner.name}`} description="Your leads and the revenue they brought in." />

      <ShareLinkCard slug={partner.slug} />

      {/* Revenue */}
      {revenue.available ? (
        <Card wash className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-label font-semibold uppercase tracking-wider text-mute">Total revenue from your leads</p>
              <p className="mt-2 text-stat font-semibold tabular-nums tracking-tight text-ink">{formatINR(revenue.totalRevenue)}</p>
              <p className="mt-1 text-meta text-mute">{compactINR(revenue.totalRevenue)} · {revenue.transactions.toLocaleString()} payments from {revenue.payingCustomers.toLocaleString()} customers</p>
            </div>
            <div className="md:border-l md:border-hairline md:pl-6">
              <p className="text-label font-semibold uppercase tracking-wider text-mute">Your share ({percent}%)</p>
              <p className="mt-2 text-stat font-semibold tabular-nums tracking-tight text-up">{formatINR(share)}</p>
              <p className="mt-1 text-meta text-mute">
                {percent > 0 ? `${compactINR(share)} of ${compactINR(revenue.totalRevenue)}` : "Your business share has not been set yet. Please contact the admin."}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex items-start gap-3 border-gold/30 p-5">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#f2b33d]" aria-hidden />
          <div>
            <p className="font-semibold text-ink">Revenue is not available right now</p>
            <p className="text-cell text-mute">
              {revenue.reason === "not_configured" ? "The revenue database has not been connected yet." : "The revenue database could not be reached. Please try again in a moment."} Your leads below are not affected.
            </p>
          </div>
        </Card>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total leads" value={total.toLocaleString()} icon={<Users className="size-4" aria-hidden />} />
        <StatTile label="Today" value={today.toLocaleString()} icon={<CalendarDays className="size-4" aria-hidden />} />
        <StatTile label="Last 7 days" value={week.toLocaleString()} icon={<CalendarRange className="size-4" aria-hidden />} />
        <StatTile
          label="Paying customers"
          value={revenue.available ? revenue.payingCustomers.toLocaleString() : "–"}
          subtext={revenue.available && total > 0 ? `${((revenue.payingCustomers / total) * 100).toFixed(1)}% of leads` : undefined}
          icon={<UserCheck className="size-4" aria-hidden />}
        />
      </div>

      {revenue.available && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Revenue / lead" value={formatINR(total ? revenue.totalRevenue / total : 0)} icon={<TrendingUp className="size-4" aria-hidden />} />
          <StatTile label="Business share" value={`${percent}%`} icon={<Percent className="size-4" aria-hidden />} />
          <StatTile label="Your share" value={compactINR(share)} subtext={formatINR(share)} icon={<IndianRupee className="size-4" aria-hidden />} />
        </div>
      )}

      {/* Recent leads */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <h2 className="font-semibold text-ink">Recent leads</h2>
          <Link href="/partner/portal/leads" className="text-cell font-semibold text-accent">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-10 text-center text-mute">No leads yet. Share your link to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-cell">
              <thead className="bg-alt text-meta font-semibold uppercase tracking-wider text-mute">
                <tr>{["Name", "Phone", "Email", "Status", "Date"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {recent.map((l) => (
                  <tr key={String(l._id)}>
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{maskPhone(l.phone)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{maskEmail(l.email)}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS[l.status]?.variant ?? "mute"}>{STATUS[l.status]?.label ?? l.status}</Badge></td>
                    <td className="whitespace-nowrap px-4 py-3 text-mute">{l.createdAt.toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
