"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  Button,
  Card,
  Input,
  Field,
} from "@/components/admin/AdminPrimitives";
import { Drawer } from "@/components/admin/Drawer";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { slugify, isReservedSlug } from "@/lib/validation/partner";
import { getReadableTextColor } from "@/lib/theme-utils";
import { ArrowRight, Check, Copy, ExternalLink, X } from "lucide-react";

interface PartnerItem {
  _id: string;
  name: string;
  slug: string;
  telegramLink: string;
  whatsappGroupLink?: string;
  zoomLink?: string;
  isActive: boolean;
  tagline?: string;
  mentorBio?: string;
  logoUrl?: string;
  theme: {
    primaryColor: string;
  };
  leadsCount: number;
  createdAt: string;
}

export default function PartnersPage() {
  const { showToast } = useToast();
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerItem | null>(null);
  const [savedSuccessUrl, setSavedSuccessUrl] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [slugReason, setSlugReason] = useState("");
  const [telegramLink, setTelegramLink] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [zoomLink, setZoomLink] = useState("");
  const [tagline, setTagline] = useState("");
  const [mentorBio, setMentorBio] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b36e0");
  const [isActive, setIsActive] = useState(true);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners");
      const json = await res.json();
      if (json.ok) {
        setPartners(json.partners);
      }
    } catch {
      showToast("Failed to load partners", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Live slug uniqueness check with debounce
  useEffect(() => {
    if (!drawerOpen) return;
    if (!slug) {
      setSlugStatus("idle");
      return;
    }

    if (isReservedSlug(slug)) {
      setSlugStatus("unavailable");
      setSlugReason("Slug is reserved by the system");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ slug });
        if (editingPartner?._id) query.set("currentId", editingPartner._id);
        const res = await fetch(`/api/admin/partners/check-slug?${query.toString()}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus("available");
          setSlugReason("");
        } else {
          setSlugStatus("unavailable");
          setSlugReason(data.reason || "Slug already taken");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, drawerOpen, editingPartner]);

  const openCreateModal = () => {
    setEditingPartner(null);
    setName("");
    setSlug("");
    setSlugStatus("idle");
    setSlugReason("");
    setTelegramLink("");
    setWhatsappLink("");
    setZoomLink("");
    setTagline("");
    setMentorBio("");
    setLogoUrl("");
    setPrimaryColor("#3b36e0");
    setIsActive(true);
    setDrawerOpen(true);
  };

  const openEditModal = (partner: PartnerItem) => {
    setEditingPartner(partner);
    setName(partner.name);
    setSlug(partner.slug);
    setSlugStatus("available");
    setSlugReason("");
    setTelegramLink(partner.telegramLink);
    setWhatsappLink(partner.whatsappGroupLink || "");
    setZoomLink(partner.zoomLink || "");
    setTagline(partner.tagline || "");
    setMentorBio(partner.mentorBio || "");
    setLogoUrl(partner.logoUrl || "");
    setPrimaryColor(partner.theme?.primaryColor || "#3b36e0");
    setIsActive(partner.isActive);
    setDrawerOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingPartner) {
      setSlug(slugify(val));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("File size exceeds 2 MB limit", "error");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setLogoUrl(data.url);
        showToast("Logo uploaded successfully", "success");
      } else {
        showToast(data.error || "Logo upload failed", "error");
      }
    } catch {
      showToast("Network error uploading logo", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleActive = async (partner: PartnerItem) => {
    try {
      const res = await fetch(`/api/admin/partners/${partner._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !partner.isActive }),
      });
      if (res.ok) {
        setPartners((prev) =>
          prev.map((p) => (p._id === partner._id ? { ...p, isActive: !p.isActive } : p))
        );
        showToast(`Partner is now ${!partner.isActive ? "Active" : "Inactive"}`, "success");
      }
    } catch {
      showToast("Failed to toggle status", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/partners/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPartners((prev) => prev.filter((p) => p._id !== deleteTarget._id));
        showToast("Partner deleted successfully", "success");
      } else {
        showToast("Failed to delete partner", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slugStatus === "unavailable") {
      showToast(slugReason || "Please choose a valid slug", "error");
      return;
    }

    startSaving(async () => {
      try {
        const payload = {
          name: name.trim(),
          slug: slug.toLowerCase().trim(),
          telegramLink: telegramLink.trim(),
          whatsappGroupLink: whatsappLink.trim() || undefined,
          zoomLink: zoomLink.trim() || undefined,
          tagline: tagline.trim() || undefined,
          mentorBio: mentorBio.trim() || undefined,
          logoUrl: logoUrl.trim() || undefined,
          isActive,
          theme: { primaryColor },
        };

        const isEdit = !!editingPartner;
        const url = isEdit
          ? `/api/admin/partners/${editingPartner._id}`
          : "/api/admin/partners";
        const method = isEdit ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.ok) {
          showToast(
            isEdit ? "Partner updated successfully!" : "Partner created successfully!",
            "success"
          );
          setDrawerOpen(false);
          await fetchPartners();

          // Set success banner showing the live URL
          const origin = window.location.origin;
          setSavedSuccessUrl(`${origin}/${data.partner.slug}`);
        } else {
          showToast(data.error || "Failed to save partner", "error");
        }
      } catch {
        showToast("Network error while saving", "error");
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("URL copied to clipboard!", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Partners Management</h1>
          <p className="mt-1 text-sm text-mute">
            Create zero-redeploy partner landing pages with custom themes, links, and branding.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-accent text-accent-ink font-semibold shadow-md shadow-accent/20"
        >
          + Add New Partner
        </Button>
      </div>

      {/* Success Live URL Banner (shown after creation/update) */}
      {savedSuccessUrl && (
        <div className="relative flex flex-col items-start justify-between gap-4 rounded-2xl border border-up/30 bg-up/10 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-up text-white">
              <Check className="size-5" aria-hidden />
            </span>
            <div>
              <h4 className="text-sm font-bold text-ink">Partner Page is LIVE Instantly!</h4>
              <p className="mt-0.5 text-xs text-mute font-mono">{savedSuccessUrl}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(savedSuccessUrl)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-card px-3.5 py-2 text-xs font-semibold text-ink shadow-sm transition hover:bg-bg-alt"
            >
              <Copy className="size-3.5" aria-hidden /> Copy URL
            </button>
            <a
              href={savedSuccessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-up px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
            >
              Open Page <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <button
              onClick={() => setSavedSuccessUrl(null)}
              className="p-1.5 text-mute hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}

      {/* Partners Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-bg-alt/50 text-xs font-semibold uppercase tracking-wider text-mute">
              <tr>
                <th className="px-6 py-4">Partner</th>
                <th className="px-6 py-4">Live URL</th>
                <th className="px-6 py-4">Telegram</th>
                <th className="px-6 py-4">Leads</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-mute">
                    Loading partners...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-mute">
                    No partners created yet. Click "+ Add New Partner" to launch your first partner!
                  </td>
                </tr>
              ) : (
                partners.map((partner) => {
                  const liveUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${partner.slug}`;

                  return (
                    <tr key={partner._id} className="transition hover:bg-bg-alt/30">
                      {/* Name & Logo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {partner.logoUrl ? (
                            <img
                              src={partner.logoUrl}
                              alt={partner.name}
                              className="size-9 rounded-xl border border-hairline object-contain p-0.5 bg-bg"
                            />
                          ) : (
                            <div
                              style={{ backgroundColor: partner.theme?.primaryColor || "#3b36e0" }}
                              className="flex size-9 items-center justify-center rounded-xl text-white font-bold text-xs shadow-sm"
                            >
                              {partner.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-ink">{partner.name}</div>
                            <div className="text-xs text-mute font-mono">/{partner.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Live URL */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-ink">/{partner.slug}</span>
                          <button
                            onClick={() => copyToClipboard(liveUrl)}
                            title="Copy full URL"
                            className="rounded-md border border-hairline p-1 text-mute hover:text-ink hover:bg-bg-alt"
                          >
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Telegram */}
                      <td className="px-6 py-4">
                        <a
                          href={partner.telegramLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline truncate max-w-[150px]"
                        >
                          <span>Telegram</span>
                          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </td>

                      {/* Leads Count */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                          {partner.leadsCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(partner)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            partner.isActive ? "bg-up" : "bg-mute/40"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                              partner.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-xs text-mute">
                        {new Date(partner.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/${partner.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-1.5 text-mute hover:text-ink hover:bg-bg-alt"
                            title="Open live partner page"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>

                          <button
                            onClick={() => openEditModal(partner)}
                            className="rounded-lg p-1.5 text-mute hover:text-accent hover:bg-bg-alt"
                            title="Edit partner"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => setDeleteTarget(partner)}
                            className="rounded-lg p-1.5 text-mute hover:text-down hover:bg-down/10"
                            title="Delete partner"
                          >
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingPartner ? `Edit Partner: ${editingPartner.name}` : "Create New Partner"}
      >
        <form onSubmit={handleSavePartner} className="space-y-6">
          {/* Partner Name */}
          <Field label="Partner / Mentor Name" required>
            <Input
              required
              placeholder="e.g. Aman Singh"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </Field>

          {/* Slug & Live Check */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">
              Custom Slug <span className="text-down">*</span>
            </label>
            <div className="relative">
              <Input
                required
                placeholder="aman-singh"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
              <div className="absolute right-3 top-2.5 text-xs font-semibold">
                {slugStatus === "checking" && <span className="text-mute animate-pulse">Checking...</span>}
                {slugStatus === "available" && <span className="inline-flex items-center gap-1 font-bold text-up"><Check className="size-3.5" aria-hidden /> Available</span>}
                {slugStatus === "unavailable" && <span className="inline-flex items-center gap-1 text-down"><X className="size-3.5" aria-hidden /> {slugReason}</span>}
              </div>
            </div>
            <p className="mt-1 text-[11px] text-mute font-mono">
              Live URL will be: domain.com/{slug || "slug"}
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Telegram Channel / Group Link" required>
              <Input
                required
                type="url"
                placeholder="https://t.me/amansidhu"
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
              />
            </Field>

            <Field label="WhatsApp Community Link (Optional)">
              <Input
                type="url"
                placeholder="https://chat.whatsapp.com/..."
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
              />
            </Field>
          </div>

          {/* Custom Tagline & Mentor Bio */}
          <Field label="Custom Hero Headline / Tagline (Optional)">
            <Input
              placeholder="e.g. Master High-Probability Price Action With Aman"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </Field>

          <Field label="Mentor Bio (Optional)">
            <textarea
              rows={3}
              placeholder="Short bio or credentials displayed in the 'About Mentor' section..."
              value={mentorBio}
              onChange={(e) => setMentorBio(e.target.value)}
              className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-sm text-ink transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>

          {/* Brand Logo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-ink">
              Brand / Mentor Logo (PNG, JPG, SVG, WebP · Max 2 MB)
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative size-16 shrink-0 rounded-2xl border border-hairline bg-card p-1 shadow-sm">
                  <img src={logoUrl} alt="Logo preview" className="size-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -right-1 -top-1 rounded-full bg-down p-0.5 text-white"
                    aria-label="Remove logo"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </div>
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-hairline-strong bg-bg-alt text-xs text-mute">
                  No Logo
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="block w-full text-xs text-mute file:mr-4 file:rounded-xl file:border-0 file:bg-accent/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/20"
                />
                {uploadingLogo && <p className="mt-1 text-xs text-accent">Uploading logo...</p>}
              </div>
            </div>
          </div>

          {/* Theme Color Pickers */}
          <div className="rounded-2xl border border-hairline bg-card/60 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-ink">Partner Brand Color</h4>
              <span className="text-[11px] text-mute">Single colour</span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-mute mb-1">Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="size-8 rounded-lg border-0 cursor-pointer p-0"
                  aria-label="Brand color"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full text-xs font-mono rounded-lg border border-hairline bg-bg p-1.5"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-mute">
                One colour drives buttons, highlights and gradients. Secondary tones are derived automatically.
              </p>
            </div>

            {/* REAL-TIME LIVE PREVIEW (Light + Dark Modes) */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-mute block mb-2">Live Theme Preview:</span>
              <div className="grid grid-cols-2 gap-3">
                {/* Light Mode Preview */}
                <div className="rounded-xl border border-hairline bg-white p-3 text-black shadow-sm">
                  <span className="text-[10px] font-bold text-gray-500 block mb-2">LIGHT MODE</span>
                  <div
                    style={{
                      backgroundColor: primaryColor,
                      color: getReadableTextColor(primaryColor),
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-center shadow-sm"
                  >
                    Get Free Pass <ArrowRight className="ml-1 inline size-3" aria-hidden />
                  </div>
                </div>

                {/* Dark Mode Preview */}
                <div className="rounded-xl border border-neutral-800 bg-[#0f1120] p-3 text-white shadow-sm">
                  <span className="text-[10px] font-bold text-neutral-400 block mb-2">DARK MODE</span>
                  <div
                    style={{
                      backgroundColor: primaryColor,
                      color: getReadableTextColor(primaryColor),
                    }}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-center shadow-sm"
                  >
                    Get Free Pass <ArrowRight className="ml-1 inline size-3" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-xl border border-hairline bg-card p-4">
            <div>
              <span className="text-sm font-semibold text-ink block">Partner Page Active</span>
              <span className="text-xs text-mute">When inactive, the page returns 404</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-up" : "bg-mute/40"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || slugStatus === "unavailable"}
              className="bg-accent text-accent-ink font-semibold"
            >
              {isSaving ? "Saving..." : editingPartner ? "Update Partner" : "Create Partner"}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Partner"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Historical leads tagged with this partner will retain their snapshot.`}
        confirmText="Delete Partner"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
