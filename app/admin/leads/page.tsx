"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Button,
  Card,
  Input,
} from "@/components/admin/AdminPrimitives";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import {
  CAPITAL_OPTIONS,
  type LeadStatus,
} from "@/lib/validation/lead";
import { ArrowRight, MessageCircle, Search, Trash2 } from "lucide-react";

interface LeadItem {
  _id: string;
  name: string;
  phone: string;
  countryCode: string;
  email: string;
  age: number;
  profession: string;
  capital: string;
  country: string;
  partnerSlug: string;
  partnerName: string;
  source: "partner-page" | "direct";
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landingUrl?: string;
  ip?: string;
  userAgent?: string;
  device?: string;
  status: LeadStatus;
  notes?: string;
  isDuplicate: boolean;
  duplicateCount: number;
  createdAt: string;
  updatedAt: string;
}

function statusSelectClass(status: LeadStatus) {
  return status === "new"
    ? "border-blue-500/30 bg-blue-500/10 text-blue-500"
    : status === "contacted"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
    : status === "joined"
    ? "border-up/30 bg-up/10 text-up"
    : "border-down/30 bg-down/10 text-down";
}

export default function LeadsPage() {
  const { showToast } = useToast();

  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [capitalFilter, setCapitalFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [partnersList, setPartnersList] = useState<{ slug: string; name: string }[]>([]);

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>("contacted");

  // Lead Detail Drawer
  const [activeLead, setActiveLead] = useState<LeadItem | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<LeadItem | null>(null);

  // Pre-select the partner when arriving from the Performance page (?partnerSlug=...)
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("partnerSlug");
    if (slug) setPartnerFilter(slug);
  }, []);

  // Load partners list for filter dropdown
  useEffect(() => {
    fetch("/api/admin/partners")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.partners)) {
          setPartnersList(data.partners.map((p: any) => ({ slug: p.slug, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) q.set("q", search.trim());
      if (partnerFilter !== "all") q.set("partnerSlug", partnerFilter);
      if (statusFilter !== "all") q.set("status", statusFilter);
      if (capitalFilter !== "all") q.set("capital", capitalFilter);
      if (startDate) q.set("startDate", startDate);
      if (endDate) q.set("endDate", endDate);

      const res = await fetch(`/api/admin/leads?${q.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setLeads(json.leads);
        setTotalLeads(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      }
    } catch {
      showToast("Failed to fetch leads", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, partnerFilter, statusFilter, capitalFilter, startDate, endDate, showToast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Inline status change
  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === leadId ? { ...l, status: newStatus } : l))
        );
        if (activeLead && activeLead._id === leadId) {
          setActiveLead((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Lead status updated to "${newStatus}"`, "success");
      }
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  // Save notes from detail drawer
  const handleSaveNotes = async () => {
    if (!activeLead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/leads/${activeLead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === activeLead._id ? { ...l, notes: editNotes } : l))
        );
        setActiveLead((prev) => (prev ? { ...prev, notes: editNotes } : null));
        showToast("Notes updated", "success");
      }
    } catch {
      showToast("Failed to update notes", "error");
    } finally {
      setSavingNotes(false);
    }
  };

  // Delete single lead
  const handleDeleteLead = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/leads/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l._id !== deleteTarget._id));
        setTotalLeads((prev) => prev - 1);
        showToast("Lead deleted", "success");
      }
    } catch {
      showToast("Failed to delete lead", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          status: bulkStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(`Updated ${data.modifiedCount} leads to "${bulkStatus}"`, "success");
        setSelectedIds(new Set());
        fetchLeads();
      }
    } catch {
      showToast("Bulk update failed", "error");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected leads?`)) return;

    try {
      const res = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast(`Deleted ${data.deletedCount} leads`, "success");
        setSelectedIds(new Set());
        fetchLeads();
      }
    } catch {
      showToast("Bulk delete failed", "error");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === leads.length && leads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l._id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export CSV url
  const getExportUrl = () => {
    const q = new URLSearchParams();
    if (search.trim()) q.set("q", search.trim());
    if (partnerFilter !== "all") q.set("partnerSlug", partnerFilter);
    if (statusFilter !== "all") q.set("status", statusFilter);
    if (capitalFilter !== "all") q.set("capital", capitalFilter);
    if (startDate) q.set("startDate", startDate);
    if (endDate) q.set("endDate", endDate);
    return `/api/admin/leads/export?${q.toString()}`;
  };

  const openDetailDrawer = (lead: LeadItem) => {
    setActiveLead(lead);
    setEditNotes(lead.notes || "");
  };

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;

  const pagination = (
    <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
      <div className="text-xs text-mute">
        Showing {totalLeads === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, totalLeads)} of{" "}
        {totalLeads.toLocaleString()} leads
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-bg-alt disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-mute">
          Page {page} of {Math.max(1, totalPages)}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-hairline bg-card px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-bg-alt disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Leads Data Table</h1>
          <p className="mt-1 text-sm text-mute">
            {totalLeads.toLocaleString()} total captured webinar registrations across all sources.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getExportUrl()}
            download
            className="inline-flex items-center gap-2 rounded-xl border border-hairline bg-card px-4 py-2.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-bg-alt"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export to CSV
          </a>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold text-mute">Search</label>
            <Input
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Partner Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Partner</label>
            <select
              value={partnerFilter}
              onChange={(e) => {
                setPartnerFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink"
            >
              <option value="all">All Partners</option>
              <option value="direct">Direct (No Partner)</option>
              {partnersList.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} (/{p.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="joined">Joined</option>
              <option value="not-interested">Not Interested</option>
            </select>
          </div>

          {/* Capital Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-mute">Capital</label>
            <select
              value={capitalFilter}
              onChange={(e) => {
                setCapitalFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-xs text-ink"
            >
              <option value="all">All Capital Ranges</option>
              {CAPITAL_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filters & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mute">Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="min-w-0 rounded-lg border border-hairline bg-bg px-2 py-1 text-xs text-ink"
            />
            <span className="text-xs text-mute">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="min-w-0 rounded-lg border border-hairline bg-bg px-2 py-1 text-xs text-ink"
            />
          </div>

          {(search || partnerFilter !== "all" || statusFilter !== "all" || capitalFilter !== "all" || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch("");
                setPartnerFilter("all");
                setStatusFilter("all");
                setCapitalFilter("all");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="text-xs font-semibold text-down hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-ink text-[10px]">
              {selectedIds.size}
            </span>
            <span>Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as LeadStatus)}
              className="rounded-lg border border-hairline bg-bg px-2.5 py-1.5 text-xs text-ink"
            >
              <option value="new">Mark New</option>
              <option value="contacted">Mark Contacted</option>
              <option value="joined">Mark Joined</option>
              <option value="not-interested">Mark Not Interested</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink shadow-sm"
            >
              Apply Status
            </button>
            <button
              onClick={handleBulkDelete}
              className="rounded-lg bg-down px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ───────── Mobile: card list ───────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="rounded-2xl border border-hairline bg-card px-6 py-12 text-center text-sm text-mute">
            Loading leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-card px-6 py-12 text-center text-sm text-mute">
            No leads found matching your criteria.
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 px-1 text-xs font-semibold text-mute">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="size-4 rounded border-hairline"
              />
              Select all on this page
            </label>

            {leads.map((lead) => {
              const whatsappClean = lead.phone.replace(/[^\d]/g, "");
              const isSelected = selectedIds.has(lead._id);

              return (
                <div
                  key={lead._id}
                  className={`rounded-2xl border bg-card p-4 ${
                    isSelected ? "border-accent/40 bg-accent/5" : "border-hairline"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(lead._id)}
                      className="mt-1 size-4 shrink-0 rounded border-hairline"
                      aria-label={`Select ${lead.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="break-words font-semibold text-ink">{lead.name}</span>
                        {lead.isDuplicate && (
                          <span className="rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold text-amber-500">
                            DUP
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-mute">
                        {new Date(lead.createdAt).toLocaleDateString()}{" "}
                        {new Date(lead.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        onClick={() => openDetailDrawer(lead)}
                        className="rounded-lg p-2 text-mute hover:bg-bg-alt hover:text-ink"
                        aria-label="View lead details"
                      >
                        <Search className="size-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(lead)}
                        className="rounded-lg p-2 text-mute hover:bg-down/10 hover:text-down"
                        aria-label="Delete lead"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-mono text-ink">
                      <span className="break-all">{lead.phone}</span>
                      <a
                        href={`https://wa.me/${whatsappClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-up"
                        aria-label="Chat on WhatsApp"
                      >
                        <MessageCircle className="size-4" aria-hidden />
                      </a>
                    </div>
                    <div className="break-all text-mute">{lead.email}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-mute">
                      <span>
                        {lead.age} yrs · {lead.profession}
                      </span>
                      <span className="font-medium text-ink">{lead.capital}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                          lead.source === "partner-page" ? "bg-accent/10 text-accent" : "bg-hairline text-mute"
                        }`}
                      >
                        {lead.partnerName}
                      </span>
                      {lead.utm_source && (
                        <span className="rounded border border-hairline bg-bg-alt px-1.5 py-0.5 font-mono text-[11px] text-mute">
                          {lead.utm_source}
                        </span>
                      )}
                    </div>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead._id, e.target.value as LeadStatus)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-semibold focus:outline-none ${statusSelectClass(lead.status)}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="joined">Joined</option>
                      <option value="not-interested">Not Interested</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div className="rounded-2xl border border-hairline bg-card">{pagination}</div>
      </div>

      {/* ───────── Desktop: table ───────── */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-bg-alt/50 text-[11px] font-semibold uppercase tracking-wider text-mute">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-hairline size-4"
                  />
                </th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Phone / WhatsApp</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">Age / Profession</th>
                <th className="px-4 py-3.5">Capital</th>
                <th className="px-4 py-3.5">Partner</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">UTM</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-sm text-mute">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-sm text-mute">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const whatsappClean = lead.phone.replace(/[^\d]/g, "");
                  const isSelected = selectedIds.has(lead._id);

                  return (
                    <tr
                      key={lead._id}
                      className={`transition ${isSelected ? "bg-accent/5" : "hover:bg-bg-alt/30"}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(lead._id)}
                          className="rounded border-hairline size-4"
                        />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-mute">
                        {new Date(lead.createdAt).toLocaleDateString()}{" "}
                        <span className="text-[10px] text-faint">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-semibold text-ink">
                        <div className="flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          {lead.isDuplicate && (
                            <span
                              title="Duplicate submission"
                              className="rounded bg-amber-500/15 px-1 py-0.5 text-[9px] font-bold text-amber-500"
                            >
                              DUP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-ink">
                          <span>{lead.phone}</span>
                          <a
                            href={`https://wa.me/${whatsappClean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-up hover:scale-110 transition-transform"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="size-4" aria-hidden />
                          </a>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-xs text-mute truncate max-w-[160px]">
                        {lead.email}
                      </td>

                      {/* Age / Profession */}
                      <td className="px-4 py-3 text-xs">
                        <div className="text-ink">{lead.age} yrs</div>
                        <div className="text-[10px] text-mute">{lead.profession}</div>
                      </td>

                      {/* Capital */}
                      <td className="px-4 py-3 text-xs font-medium text-ink whitespace-nowrap">
                        {lead.capital}
                      </td>

                      {/* Partner Tag */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                            lead.source === "partner-page"
                              ? "bg-accent/10 text-accent"
                              : "bg-hairline text-mute"
                          }`}
                        >
                          {lead.partnerName}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(lead._id, e.target.value as LeadStatus)
                          }
                          className={`rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none ${statusSelectClass(lead.status)}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="joined">Joined</option>
                          <option value="not-interested">Not Interested</option>
                        </select>
                      </td>

                      {/* UTM */}
                      <td className="px-4 py-3 text-[11px] text-mute">
                        {lead.utm_source ? (
                          <span className="font-mono bg-bg-alt px-1.5 py-0.5 rounded border border-hairline">
                            {lead.utm_source}
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openDetailDrawer(lead)}
                          className="rounded-lg p-1 text-mute hover:text-ink hover:bg-bg-alt"
                          title="View lead details"
                        >
                          <Search className="size-4" aria-hidden />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(lead)}
                          className="rounded-lg p-1 text-mute hover:text-down hover:bg-down/10 ml-1"
                          title="Delete lead"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-hairline">{pagination}</div>
      </Card>

      {/* Lead Detail Drawer */}
      <Drawer
        isOpen={!!activeLead}
        onClose={() => setActiveLead(null)}
        title={activeLead ? `Lead: ${activeLead.name}` : "Lead Details"}
      >
        {activeLead && (
          <div className="space-y-6">
            {/* Quick Profile */}
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-card p-4">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-bold text-ink">{activeLead.name}</h3>
                <p className="break-all text-xs text-mute">{activeLead.email}</p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    activeLead.status === "new"
                      ? "bg-blue-500/15 text-blue-500"
                      : activeLead.status === "contacted"
                      ? "bg-amber-500/15 text-amber-500"
                      : activeLead.status === "joined"
                      ? "bg-up/15 text-up"
                      : "bg-down/15 text-down"
                  }`}
                >
                  {activeLead.status}
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="rounded-xl border border-hairline bg-bg-alt/40 p-3 sm:col-span-2">
                <span className="text-[11px] font-semibold text-mute block">Phone (WhatsApp)</span>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-ink break-all">{activeLead.phone}</span>
                  <a
                    href={`https://wa.me/${activeLead.phone.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-up font-semibold hover:underline"
                  >
                    Open Chat <ArrowRight className="ml-1 inline size-3.5" aria-hidden />
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-hairline bg-bg-alt/40 p-3">
                <span className="text-[11px] font-semibold text-mute block">Trading Capital</span>
                <span className="text-xs font-bold text-ink mt-1 block">{activeLead.capital}</span>
              </div>

              <div className="rounded-xl border border-hairline bg-bg-alt/40 p-3">
                <span className="text-[11px] font-semibold text-mute block">Age & Profession</span>
                <span className="text-xs font-bold text-ink mt-1 block">
                  {activeLead.age} yrs · {activeLead.profession}
                </span>
              </div>

              <div className="rounded-xl border border-hairline bg-bg-alt/40 p-3 sm:col-span-2">
                <span className="text-[11px] font-semibold text-mute block">Country</span>
                <span className="text-xs font-bold text-ink mt-1 block">{activeLead.country}</span>
              </div>
            </div>

            {/* Partner & Attribution Details */}
            <div className="rounded-2xl border border-hairline bg-card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-mute">
                Attribution & Partner Source
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-mute block">Attributed Partner</span>
                  <span className="font-semibold text-accent break-words">{activeLead.partnerName}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-mute block">Partner Slug</span>
                  <span className="font-mono text-ink font-semibold break-all">/{activeLead.partnerSlug}</span>
                </div>
                <div>
                  <span className="text-mute block">Source Channel</span>
                  <span className="capitalize text-ink">{activeLead.source}</span>
                </div>
                <div>
                  <span className="text-mute block">Device</span>
                  <span className="capitalize text-ink">{activeLead.device || "desktop"}</span>
                </div>
                {activeLead.utm_source && (
                  <div className="min-w-0">
                    <span className="text-mute block">UTM Source</span>
                    <span className="font-mono text-ink break-all">{activeLead.utm_source}</span>
                  </div>
                )}
                {activeLead.utm_medium && (
                  <div className="min-w-0">
                    <span className="text-mute block">UTM Medium</span>
                    <span className="font-mono text-ink break-all">{activeLead.utm_medium}</span>
                  </div>
                )}
                {activeLead.utm_campaign && (
                  <div className="min-w-0">
                    <span className="text-mute block">UTM Campaign</span>
                    <span className="font-mono text-ink break-all">{activeLead.utm_campaign}</span>
                  </div>
                )}
                {activeLead.referrer && (
                  <div className="col-span-2 min-w-0">
                    <span className="text-mute block">Referrer</span>
                    <span className="font-mono text-xs text-mute truncate block">{activeLead.referrer}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CRM Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-mute block">
                Lead Notes & Follow-up History
              </label>
              <textarea
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about call discussion, trading experience, webinar attendance..."
                className="w-full rounded-xl border border-hairline bg-bg p-3 text-xs text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-accent text-accent-ink text-xs font-semibold py-2"
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Lead"
        description={`Are you sure you want to delete lead "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete Lead"
        danger
        onConfirm={handleDeleteLead}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
