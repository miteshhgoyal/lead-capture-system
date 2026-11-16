"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/admin/AdminPrimitives";

interface StatsData {
  metrics: {
    totalLeads: number;
    todayLeads: number;
    last7DaysLeads: number;
    last30DaysLeads: number;
    activePartnersCount: number;
  };
  statusBreakdown: { status: string; count: number }[];
  partnerBreakdown: { slug: string; name: string; count: number; sharePct: number }[];
  capitalBreakdown: { capital: string; count: number }[];
  professionBreakdown: { profession: string; count: number }[];
  countryBreakdown: { country: string; count: number }[];
  overTime: { date: string; count: number }[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  const fetchStats = async (r: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${r}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  const maxOverTime = data?.overTime?.reduce((m, d) => Math.max(m, d.count), 1) || 1;

  return (
    <div className="space-y-8">
      {/* Top Header & Range Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-mute">
            Live lead acquisition performance, partner activity, and conversion insights.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-card p-1">
          {["7d", "30d", "90d", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition ${
                range === r
                  ? "bg-accent text-accent-ink shadow-sm"
                  : "text-mute hover:text-ink hover:bg-bg-alt"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <span className="text-xs font-medium text-mute">Total Leads</span>
          <div className="mt-2 text-3xl font-extrabold text-ink">
            {loading ? "..." : (data?.metrics.totalLeads ?? 0).toLocaleString()}
          </div>
          <span className="mt-1 block text-[11px] text-mute">All-time captured leads</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-medium text-mute">Today's Leads</span>
          <div className="mt-2 text-3xl font-extrabold text-up">
            {loading ? "..." : (data?.metrics.todayLeads ?? 0).toLocaleString()}
          </div>
          <span className="mt-1 block text-[11px] text-mute">Since midnight UTC</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-medium text-mute">Last 7 Days</span>
          <div className="mt-2 text-3xl font-extrabold text-ink">
            {loading ? "..." : (data?.metrics.last7DaysLeads ?? 0).toLocaleString()}
          </div>
          <span className="mt-1 block text-[11px] text-mute">Weekly pace</span>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-medium text-mute">Active Partners</span>
          <div className="mt-2 text-3xl font-extrabold text-accent">
            {loading ? "..." : (data?.metrics.activePartnersCount ?? 0).toLocaleString()}
          </div>
          <span className="mt-1 block text-[11px] text-mute">Live partner landing pages</span>
        </Card>
      </div>

      {/* Leads Over Time Trend Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h3 className="text-base font-bold text-ink">Leads Over Time</h3>
            <p className="text-xs text-mute">Daily submissions across all partners ({range.toUpperCase()})</p>
          </div>
          <Link
            href="/admin/leads"
            className="text-xs font-semibold text-accent hover:underline"
          >
            View All Leads →
          </Link>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center text-sm text-mute">
            Loading chart data...
          </div>
        ) : !data?.overTime || data.overTime.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center text-center text-sm text-mute">
            <span className="text-2xl mb-1">📊</span>
            No lead submissions in this period yet.
          </div>
        ) : (
          <div className="mt-4 flex h-56 items-end gap-2 overflow-x-auto pb-4 pt-8">
            {data.overTime.map((d) => {
              const heightPct = Math.max(8, Math.round((d.count / maxOverTime) * 100));
              return (
                <div
                  key={d.date}
                  className="group relative flex flex-1 min-w-[28px] flex-col items-center justify-end h-full"
                >
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 hidden rounded-md bg-ink px-2 py-1 text-[10px] font-semibold text-bg shadow-lg group-hover:block z-20 whitespace-nowrap">
                    {d.date}: {d.count} leads
                  </div>
                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full rounded-t-lg bg-accent/80 transition-all hover:bg-accent hover:brightness-110"
                  />
                  {/* Date label */}
                  <span className="mt-2 text-[10px] text-faint truncate max-w-full">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Conversion by Status & Top Partners */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Status Distribution */}
        <div className="lg:col-span-5">
          <Card className="p-6 h-full">
            <h3 className="text-base font-bold text-ink">Leads by Status</h3>
            <p className="text-xs text-mute">Pipeline conversion distribution</p>

            <div className="mt-6 space-y-3">
              {[
                { key: "new", label: "New Leads", color: "bg-blue-500", text: "text-blue-500" },
                { key: "contacted", label: "Contacted", color: "bg-amber-500", text: "text-amber-500" },
                { key: "joined", label: "Joined Webinar", color: "bg-up", text: "text-up" },
                { key: "not-interested", label: "Not Interested", color: "bg-down", text: "text-down" },
              ].map((s) => {
                const count =
                  data?.statusBreakdown.find((x) => x.status === s.key)?.count || 0;
                const total = data?.metrics.totalLeads || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={s.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{s.label}</span>
                      <span className="font-semibold text-mute">
                        {count.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-hairline">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${s.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Top Partners */}
        <div className="lg:col-span-7">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-base font-bold text-ink">Top Partners by Leads</h3>
                <p className="text-xs text-mute">Highest performing referral partners</p>
              </div>
              <Link
                href="/admin/partners"
                className="text-xs font-semibold text-accent hover:underline"
              >
                Manage Partners →
              </Link>
            </div>

            {!data?.partnerBreakdown || data.partnerBreakdown.length === 0 ? (
              <div className="py-12 text-center text-sm text-mute">
                No partner data available yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-hairline">
                {data.partnerBreakdown.map((p, i) => (
                  <div key={p.slug} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded-full bg-hairline text-[11px] font-bold text-mute">
                        {i + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-ink">{p.name}</div>
                        <div className="text-xs text-mute">/{p.slug}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-ink">
                        {p.count.toLocaleString()} leads
                      </div>
                      <div className="text-[11px] text-mute">{p.sharePct}% share</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Breakdowns: Capital, Profession, Country */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* By Capital */}
        <Card className="p-5">
          <h4 className="text-sm font-bold text-ink">Trading Capital</h4>
          <p className="text-[11px] text-mute">Declared investment range</p>
          <div className="mt-4 space-y-2.5">
            {(data?.capitalBreakdown || []).map((c) => (
              <div key={c.capital} className="flex items-center justify-between text-xs">
                <span className="text-mute truncate max-w-[180px]">{c.capital}</span>
                <span className="font-semibold text-ink">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* By Profession */}
        <Card className="p-5">
          <h4 className="text-sm font-bold text-ink">Profession</h4>
          <p className="text-[11px] text-mute">Background breakdown</p>
          <div className="mt-4 space-y-2.5">
            {(data?.professionBreakdown || []).map((p) => (
              <div key={p.profession} className="flex items-center justify-between text-xs">
                <span className="text-mute">{p.profession}</span>
                <span className="font-semibold text-ink">{p.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* By Country */}
        <Card className="p-5">
          <h4 className="text-sm font-bold text-ink">Top Countries</h4>
          <p className="text-[11px] text-mute">Geographic distribution</p>
          <div className="mt-4 space-y-2.5">
            {(data?.countryBreakdown || []).map((c) => (
              <div key={c.country} className="flex items-center justify-between text-xs">
                <span className="text-mute">{c.country}</span>
                <span className="font-semibold text-ink">{c.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
