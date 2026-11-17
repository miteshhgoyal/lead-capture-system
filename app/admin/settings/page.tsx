"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Button,
  Card,
  Input,
  Field,
  SectionHeader,
} from "@/components/admin/AdminPrimitives";
import { useToast } from "@/components/admin/Toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Shuffle, X } from "lucide-react";
import type { SiteSettingsData } from "@/lib/defaults";

export default function SettingsPage() {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [shuffleOpen, setShuffleOpen] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSettings((prev) => (prev ? { ...prev, logoUrl: data.url } : prev));
        showToast("Logo uploaded. Save settings to apply it.", "success");
      } else {
        showToast(data.error || "Logo upload failed", "error");
      }
    } catch {
      showToast("Network error uploading logo", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleShuffle = async (original: boolean) => {
    try {
      const res = await fetch("/api/admin/settings/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        showToast(original ? "Root page restored to the original design" : "Root page shuffled", "success");
      } else {
        showToast(json.error || "Failed to shuffle page", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setShuffleOpen(false);
    }
  };

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => showToast("Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    startSaving(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          showToast("Settings updated successfully", "success");
        } else {
          showToast(data.error || "Failed to update settings", "error");
        }
      } catch {
        showToast("Network error saving settings", "error");
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showToast("Admin password changed successfully", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Failed to change password", "error");
      }
    } catch {
      showToast("Network error changing password", "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-12 text-center text-sm text-mute">
        Loading system settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">System Settings</h1>
        <p className="mt-1 text-sm text-mute">
          Configure default webinar landing page copy, community links, and administrator access.
        </p>
      </div>

      {/* Default Landing Page Copy & Community */}
      <Card className="p-6">
        <SectionHeader
          title="Default Landing Page & Webinar Settings"
          description="Applied to the generic root page (domain.com/) and used as default template for new partners."
        />

        <form onSubmit={handleSaveSettings} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand / Academy Name" required>
              <Input
                required
                value={settings.brandName}
                onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
              />
            </Field>

            <Field label="Trust Line Tag">
              <Input
                value={settings.trustLine}
                onChange={(e) => setSettings({ ...settings, trustLine: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Hero Headline" required>
            <Input
              required
              value={settings.headline}
              onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
            />
          </Field>

          <Field label="Hero Subheadline" required>
            <textarea
              rows={2}
              required
              value={settings.subheadline}
              onChange={(e) => setSettings({ ...settings, subheadline: e.target.value })}
              className="w-full rounded-xl border border-hairline bg-bg p-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Telegram Community Link (Optional)">
              <Input
                type="url"
                value={settings.defaultTelegramLink}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTelegramLink: e.target.value })
                }
              />
            </Field>

            <Field label="WhatsApp Community Link (Optional)">
              <Input
                type="url"
                value={settings.defaultWhatsappLink || ""}
                onChange={(e) =>
                  setSettings({ ...settings, defaultWhatsappLink: e.target.value })
                }
              />
            </Field>
          </div>

          <p className="-mt-2 text-xs text-mute">
            Community links are shown to a visitor only after they submit the form, never elsewhere on the page.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Brand Colour">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor || "#0f766e"}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="size-9 cursor-pointer rounded-lg border-0 p-0"
                  aria-label="Brand colour"
                />
                <Input
                  value={settings.primaryColor || ""}
                  placeholder="Original palette"
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                />
                {settings.primaryColor ? (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, primaryColor: "" })}
                    className="text-xs text-mute underline hover:text-ink"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </Field>

            <Field label="Logo (PNG, JPG, SVG, WebP · Max 2 MB)">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <div className="relative size-12 shrink-0 rounded-xl border border-hairline bg-card p-1">
                    <img src={settings.logoUrl} alt="Logo preview" className="size-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: "" })}
                      className="absolute -right-1 -top-1 rounded-full bg-down p-0.5 text-white"
                      aria-label="Remove logo"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="block w-full text-xs text-mute file:mr-3 file:rounded-xl file:border-0 file:bg-accent/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent"
                />
              </div>
              {uploadingLogo && <p className="mt-1 text-xs text-accent">Uploading logo...</p>}
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-bg-alt/40 p-4">
            <div>
              <p className="text-sm font-semibold text-ink">Root page layout</p>
              <p className="text-xs text-mute">Shuffle picks a new layout, copy, theme and section order for the root page.</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => handleShuffle(true)}>
                Use original
              </Button>
              <Button type="button" onClick={() => setShuffleOpen(true)} className="bg-accent text-accent-ink">
                <Shuffle className="mr-1.5 size-4" aria-hidden /> Shuffle page
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Default Mentor / Speaker Name">
              <Input
                value={settings.defaultMentorName}
                onChange={(e) =>
                  setSettings({ ...settings, defaultMentorName: e.target.value })
                }
              />
            </Field>

            <Field label="Default Zoom Link (Optional)">
              <Input
                type="url"
                value={settings.defaultZoomLink || ""}
                onChange={(e) =>
                  setSettings({ ...settings, defaultZoomLink: e.target.value })
                }
              />
            </Field>
          </div>

          <Field label="Default Mentor Bio">
            <textarea
              rows={3}
              value={settings.defaultMentorBio}
              onChange={(e) =>
                setSettings({ ...settings, defaultMentorBio: e.target.value })
              }
              className="w-full rounded-xl border border-hairline bg-bg p-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>

          <Field label="Mandatory Risk Disclaimer">
            <textarea
              rows={2}
              value={settings.disclaimer}
              onChange={(e) => setSettings({ ...settings, disclaimer: e.target.value })}
              className="w-full rounded-xl border border-hairline bg-bg p-3 text-xs text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </Field>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-accent text-accent-ink font-semibold"
            >
              {isSaving ? "Saving Settings..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Change Admin Password */}
      <Card className="p-6">
        <SectionHeader
          title="Change Administrator Password"
          description="Update your administrator credentials used to log into /admin."
        />

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <Field label="Current Password (Optional if initial login)">
            <Input
              type="password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="New Password (min 8 chars)" required>
              <Input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirm New Password" required>
              <Input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={passwordSaving}
              className="bg-accent text-accent-ink font-semibold"
            >
              {passwordSaving ? "Updating Password..." : "Update Password"}
            </Button>
          </div>
        </form>
      </Card>
      <ConfirmDialog
        isOpen={shuffleOpen}
        title="Shuffle root page"
        description="Pick a brand new layout, copy, theme and section order for the root page? The current look will be replaced."
        confirmText="Shuffle"
        onConfirm={() => handleShuffle(false)}
        onCancel={() => setShuffleOpen(false)}
      />
    </div>
  );
}
