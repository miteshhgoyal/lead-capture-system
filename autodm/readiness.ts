import { readConfig, type AutoDmConfig } from "./config";

export interface ReadinessItem {
  key: string;
  label: string;
  present: boolean;
  required: boolean;
  hint?: string;
}

const HEX64 = /^[0-9a-fA-F]{64}$/;

/** Env checklist. Never returns values, only whether each item is set. */
export function computeReadiness(c: AutoDmConfig = readConfig(), env: Record<string, string | undefined> = process.env): { items: ReadinessItem[]; missing: ReadinessItem[]; ready: boolean; mock: boolean } {
  const mock = c.mockMeta;
  const hasMongo = Boolean((env.MONGODB_URI ?? "").trim());
  const secret = Boolean(c.instagramAppSecret || c.appSecret);
  const appId = Boolean(c.instagramAppId || c.appId);
  const items: ReadinessItem[] = [
    { key: "MONGODB_URI", label: "Database connection", present: hasMongo, required: true },
    { key: "APP_ENCRYPTION_KEY", label: "Token encryption key (32 bytes hex)", present: HEX64.test(c.encryptionKey), required: true, hint: c.encryptionKey && !HEX64.test(c.encryptionKey) ? "Must be exactly 64 hex characters" : "openssl rand -hex 32" },
    { key: "META_APP_SECRET / INSTAGRAM_APP_SECRET", label: "Meta app secret (webhook signature)", present: secret, required: true },
    { key: "META_WEBHOOK_VERIFY_TOKEN", label: "Webhook verify token", present: Boolean(c.webhookVerifyToken), required: !mock },
    { key: "META_APP_ID / INSTAGRAM_APP_ID", label: "Meta app id", present: appId, required: !mock },
    { key: "INSTAGRAM_REDIRECT_URI", label: "Instagram OAuth redirect URI", present: Boolean(c.instagramRedirectUri), required: !mock },
    { key: "NEXT_PUBLIC_SITE_URL", label: "Public site URL (tracked links)", present: Boolean(c.siteUrl), required: !mock },
    { key: "AUTODM_CRON_SECRET", label: "Cron secret (retries, token refresh, retention)", present: Boolean(c.cronSecret), required: false, hint: "Needed to call /api/autodm/cron from a scheduler" },
    { key: "META_WEBHOOK_URL", label: "Webhook URL (reference)", present: Boolean(c.webhookUrl), required: false },
    { key: "FACEBOOK_REDIRECT_URI", label: "Facebook OAuth redirect URI", present: Boolean(c.facebookRedirectUri), required: false, hint: "Only for Facebook Messenger" },
  ];
  const missing = items.filter((i) => i.required && !i.present);
  return { items, missing, ready: missing.length === 0, mock };
}
