"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/admin/AdminPrimitives";
import { ArrowRight } from "lucide-react";

interface PerformanceItem {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  logoUrl?: string;
  totalLeads: number;
  last7Days: number;
  last30Days: number;
  joinedCount: number;
  contactedCount: number;
  sharePct: number;
  conversionRate: number;
}

function rankClass(index: number) {
  return index === 0
    ? "bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/30"
    : index === 1
    ? "bg-slate-400/20 text-slate-400"
    : index === 2
    ? "bg-amber-700/20 text-amber-700"
    : "text-mute";
}

export default function PerformancePage() {
  const [data, setData] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/performance")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setData(json.performance);
        }
      })
      .catch((e) => console.error("Failed to load performance", e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Partner Performance</h1>
        <p className="mt-1 text-sm text-mute">
          Live leaderboard tracking lead velocity, webinar attendance rate, and referral share by partner.
        </p>
      </div>

      {/* ───────── Mobile: card list ───────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-hairline bg-card px-6 py-12 text-center text-sm text-mute">
            Loading performance leaderboard...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-card px-6 py-12 text-center text-sm text-mute">
            No partner activity recorded yet.
          </div>
        ) : (
          data.map((item, index) => (
            <div key={item.slug} className="rounded-2xl border border-hairline bg-card p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankClass(index)}`}
                >
                  {index + 1}
                </span>
                {item.logoUrl ? (
                  <img
                    src={item.logoUrl}
                    alt={item.name}
                    className="size-8 shrink-0 rounded-lg border border-hairline object-contain p-0.5"
                  />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                    {item.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{item.name}</div>
                  <div className="truncate font-mono text-xs text-mute">/{item.slug}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-bg-alt/50 p-2.5">
                  <div className="text-base font-extrabold text-ink">{item.totalLeads.toLocaleString()}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-mute">Total</div>
                </div>
                <div className="rounded-xl bg-bg-alt/50 p-2.5">
                  <div className="text-base font-bold text-ink">{item.last7Days.toLocaleString()}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-mute">7 days</div>
                </div>
                <div className="rounded-xl bg-bg-alt/50 p-2.5">
                  <div className="text-base font-bold text-ink">{item.last30Days.toLocaleString()}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-mute">30 days</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-mute">Joined webinar: </span>
                  <span className="font-bold text-up">{item.joinedCount.toLocaleString()}</span>
                  <span className="ml-1 text-[11px] text-mute">({item.conversionRate}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-hairline">
                    <div style={{ width: `${item.sharePct}%` }} className="h-full rounded-full bg-accent" />
                  </div>
                  <span className="font-semibold text-mute">{item.sharePct}%</span>
                </div>
              </div>

              <div className="mt-3 border-t border-hairline pt-3 text-right">
                <Link
                  href={`/admin/leads?partnerSlug=${item.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  <span>View Leads</span>
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ───────── Desktop: table ───────── */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-bg-alt/50 text-[11px] font-semibold uppercase tracking-wider text-mute">
              <tr>
                <th className="px-6 py-4 w-12 text-center">Rank</th>
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Total Leads</th>
                <th className="px-6 py-4">Last 7 Days</th>
                <th className="px-6 py-4">Last 30 Days</th>
                <th className="px-6 py-4">Joined Webinar</th>
                <th className="px-6 py-4">Share %</th>
                <th className="px-6 py-4 text-right">View Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-mute">
                    Loading performance leaderboard...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-mute">
                    No partner activity recorded yet.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => {
                  return (
                    <tr key={item.slug} className="transition hover:bg-bg-alt/30">
                      {/* Rank */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${rankClass(index)}`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Partner Name & Slug */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.logoUrl ? (
                            <img
                              src={item.logoUrl}
                              alt={item.name}
                              className="size-8 rounded-lg border border-hairline object-contain p-0.5"
                            />
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent text-xs font-bold">
                              {item.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-ink">{item.name}</div>
                            <div className="text-xs text-mute font-mono">/{item.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Total Leads */}
                      <td className="px-6 py-4">
                        <span className="text-base font-extrabold text-ink">
                          {item.totalLeads.toLocaleString()}
                        </span>
                      </td>

                      {/* Last 7 Days */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-ink">
                          {item.last7Days.toLocaleString()}
                        </span>
                      </td>

                      {/* Last 30 Days */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-ink">
                          {item.last30Days.toLocaleString()}
                        </span>
                      </td>

                      {/* Joined Webinar & Conv Rate */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-up">
                            {item.joinedCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-[11px] text-mute">
                            ({item.conversionRate}%)
                          </span>
                        </div>
                      </td>

                      {/* Share % */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-hairline overflow-hidden">
                            <div
                              style={{ width: `${item.sharePct}%` }}
                              className="h-full rounded-full bg-accent"
                            />
                          </div>
                          <span className="text-xs font-semibold text-mute">
                            {item.sharePct}%
                          </span>
                        </div>
                      </td>

                      {/* View Leads Link */}
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/leads?partnerSlug=${item.slug}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                        >
                          <span>View Leads</span>
                          <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
