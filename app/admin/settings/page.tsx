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
import type { SiteSettingsData } from "@/lib/defaults";

export default function SettingsPage() {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, startSaving] = useTransition();

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
            <Field label="Default Telegram Link" required>
              <Input
                type="url"
                required
                value={settings.defaultTelegramLink}
                onChange={(e) =>
                  setSettings({ ...settings, defaultTelegramLink: e.target.value })
                }
              />
            </Field>

            <Field label="Default WhatsApp Link (Optional)">
              <Input
                type="url"
                value={settings.defaultWhatsappLink || ""}
                onChange={(e) =>
                  setSettings({ ...settings, defaultWhatsappLink: e.target.value })
                }
              />
            </Field>
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
    </div>
  );
}
