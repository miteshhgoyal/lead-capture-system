/**
 * AutoDM configuration: the ONLY place that reads AutoDM environment variables, plus every Meta
 * platform constant. Nothing here throws when envs are empty (the app must boot without them).
 *
 * Every limit/permission/endpoint below comes from memory of the Instagram Platform docs and MUST be
 * re-verified against the current documentation before App Review:
 *   https://developers.facebook.com/docs/instagram-platform
 *   https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 *   https://developers.facebook.com/docs/messenger-platform
 */

type Env = Record<string, string | undefined>;

const clean = (v: string | undefined): string => (v ?? "").trim();

export interface AutoDmConfig {
  appId: string;
  appSecret: string;
  instagramAppId: string;
  instagramAppSecret: string;
  webhookVerifyToken: string;
  graphVersion: string;
  instagramScopes: string[];
  facebookScopes: string[];
  instagramRedirectUri: string;
  facebookRedirectUri: string;
  webhookUrl: string;
  deauthorizeUrl: string;
  dataDeletionUrl: string;
  encryptionKey: string;
  queueName: string;
  mockMeta: boolean;
  cronSecret: string;
  siteUrl: string;
  isProduction: boolean;
}

const list = (v: string | undefined, fallback: string[]): string[] => {
  const parts = clean(v)
    .split(/[\s,]+/)
    .filter(Boolean);
  return parts.length ? parts : fallback;
};

/** Graph API version used when META_GRAPH_API_VERSION is empty. Re-verify the current version. */
export const DEFAULT_GRAPH_VERSION = "v23.0";

export function readConfig(env: Env = process.env): AutoDmConfig {
  const isProduction = env.NODE_ENV === "production";
  return {
    appId: clean(env.META_APP_ID),
    appSecret: clean(env.META_APP_SECRET),
    instagramAppId: clean(env.INSTAGRAM_APP_ID),
    instagramAppSecret: clean(env.INSTAGRAM_APP_SECRET),
    webhookVerifyToken: clean(env.META_WEBHOOK_VERIFY_TOKEN),
    graphVersion: clean(env.META_GRAPH_API_VERSION) || DEFAULT_GRAPH_VERSION,
    instagramScopes: list(env.META_INSTAGRAM_SCOPES, ["instagram_business_basic", "instagram_business_manage_messages", "instagram_business_manage_comments"]),
    facebookScopes: list(env.META_FACEBOOK_SCOPES, ["pages_show_list", "pages_messaging", "pages_manage_metadata", "pages_read_engagement"]),
    instagramRedirectUri: clean(env.INSTAGRAM_REDIRECT_URI),
    facebookRedirectUri: clean(env.FACEBOOK_REDIRECT_URI),
    webhookUrl: clean(env.META_WEBHOOK_URL),
    deauthorizeUrl: clean(env.META_DEAUTHORIZE_URL),
    dataDeletionUrl: clean(env.META_DATA_DELETION_URL),
    encryptionKey: clean(env.APP_ENCRYPTION_KEY),
    queueName: clean(env.AUTODM_QUEUE_NAME) || "autodm",
    // The fake Meta client is never honoured in production builds.
    mockMeta: clean(env.AUTODM_MOCK_META).toLowerCase() === "true" && !isProduction,
    cronSecret: clean(env.AUTODM_CRON_SECRET),
    siteUrl: clean(env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, ""),
    isProduction,
  };
}

export const config = (): AutoDmConfig => readConfig();

/** Secrets that may sign webhooks / signed_request payloads (Instagram-login app secret or the Meta app secret). */
export function signingSecrets(c: AutoDmConfig = config()): string[] {
  return [c.instagramAppSecret, c.appSecret].filter(Boolean);
}

// ── Meta platform rules (re-verify) ──────────────────────────────────────────────────────────────
export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

/** A Private Reply must be sent within 7 days of the comment, one per comment. */
export const PRIVATE_REPLY_WINDOW_MS = 7 * DAY;
/** A standard DM reply must be sent within 24 hours of the user's last inbound message. */
export const DM_WINDOW_MS = 24 * HOUR;
/** The optional Human Agent tag extends the DM window to 7 days. */
export const HUMAN_AGENT_WINDOW_MS = 7 * DAY;

/** Max characters for a DM text body (Instagram text limit is expressed in bytes; this is conservative). */
export const MAX_DM_TEXT = 900;
/** Max characters for button-template text. */
export const MAX_BUTTON_TEXT = 600;
/** Max buttons in a button template. */
export const MAX_BUTTONS = 3;
export const MAX_BUTTON_LABEL = 20;
/** Max characters for a public comment reply. */
export const MAX_COMMENT_REPLY = 300;
export const MAX_KEYWORDS = 20;
export const MAX_KEYWORD_LEN = 60;

/** Access-token refresh: refresh long-lived tokens that expire within this many days. */
export const TOKEN_REFRESH_WITHIN_DAYS = 10;

/** Webhook fields subscribed per platform (re-verify names in the Webhooks reference). */
export const INSTAGRAM_WEBHOOK_FIELDS = ["comments", "messages", "messaging_postbacks", "message_reactions", "messaging_seen"];
export const FACEBOOK_WEBHOOK_FIELDS = ["messages", "messaging_postbacks", "feed"];

/** Raw webhook payload / message body retention, in days (also editable in the admin Limits tab). */
export const DEFAULT_PAYLOAD_RETENTION_DAYS = 30;
export const DEFAULT_MESSAGE_RETENTION_DAYS = 180;

/** Retry policy for transient send errors. */
export const MAX_ATTEMPTS = 5;
export const BACKOFF_BASE_MS = 15_000;
export const BACKOFF_MAX_MS = 15 * 60 * 1000;

/** Per-account outbound throttle (sliding window). */
export const THROTTLE_MAX_CALLS = 30;
export const THROTTLE_WINDOW_MS = 60_000;
