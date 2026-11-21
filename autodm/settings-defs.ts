/** Feature flags and limits (namespace `autodm.*`). Pure: the DB-backed store lives in settings-store.ts. */

export type SettingType = "bool" | "int" | "enum" | "idlist";

export interface SettingDef {
  key: string;
  type: SettingType;
  default: boolean | number | string | string[];
  group: "master" | "platforms" | "triggers" | "features" | "safety" | "limits" | "rollout" | "retention";
  label: string;
  help: string;
  min?: number;
  max?: number;
  options?: string[];
  /** Needs a confirmation modal in the admin UI. */
  dangerous?: boolean;
}

export const SETTING_DEFS: SettingDef[] = [
  { key: "autodm.enabled", type: "bool", default: false, group: "master", label: "AutoDM master switch", help: "When off, the whole feature is dark: user pages and APIs return 404, workers discard AutoDM jobs. The webhook still answers 200 so Meta keeps the subscription.", dangerous: true },
  { key: "autodm.instagram.enabled", type: "bool", default: true, group: "platforms", label: "Instagram", help: "Instagram connections and automations." },
  { key: "autodm.facebook.enabled", type: "bool", default: false, group: "platforms", label: "Facebook Messenger", help: "Facebook Page connections and automations. Keep off to launch Instagram-only." },
  { key: "autodm.oauth.enabled", type: "bool", default: true, group: "features", label: "Allow new connections", help: "When off, no new account can be connected. Existing accounts keep working." },
  { key: "autodm.webhooks.enabled", type: "bool", default: true, group: "features", label: "Process incoming Meta events", help: "When off, valid webhooks are answered with 200 and discarded." },
  { key: "autodm.sending.enabled", type: "bool", default: true, group: "safety", label: "Outbound sending (kill switch)", help: "When off, events are still recorded but nothing is sent to Meta. Runs are marked skipped_sending_disabled and can be replayed later while still inside the window.", dangerous: true },
  { key: "autodm.triggers.comment", type: "bool", default: true, group: "triggers", label: "Comment triggers", help: "Private reply when someone comments on a post/reel." },
  { key: "autodm.triggers.story", type: "bool", default: true, group: "triggers", label: "Story reply / mention triggers", help: "Reply to story replies and story mentions." },
  { key: "autodm.triggers.dm_keyword", type: "bool", default: true, group: "triggers", label: "DM keyword triggers", help: "Reply to incoming DMs that match a keyword (and the optional default reply)." },
  { key: "autodm.public_comment_reply.enabled", type: "bool", default: true, group: "features", label: "Public comment replies", help: "Allow the optional public reply under the comment." },
  { key: "autodm.leads.enabled", type: "bool", default: true, group: "features", label: "Lead capture and export", help: "Store leads from automations and allow CSV export." },
  { key: "autodm.analytics.enabled", type: "bool", default: true, group: "features", label: "Analytics page", help: "Show analytics to users." },
  { key: "autodm.max_accounts_per_user", type: "int", default: 3, group: "limits", label: "Max accounts per user", help: "Connected accounts one user may have.", min: 1, max: 50 },
  { key: "autodm.max_active_automations_per_account", type: "int", default: 20, group: "limits", label: "Max active automations per account", help: "Active automations on one account.", min: 1, max: 500 },
  { key: "autodm.daily_dm_limit_per_account", type: "int", default: 1000, group: "limits", label: "Daily DM cap per account", help: "Safety cap on DMs and private replies sent per account per day.", min: 1, max: 100000 },
  { key: "autodm.payload_retention_days", type: "int", default: 30, group: "retention", label: "Raw webhook payload retention (days)", help: "Raw payloads older than this are purged. Aggregates are kept.", min: 1, max: 365 },
  { key: "autodm.message_retention_days", type: "int", default: 180, group: "retention", label: "Message body retention (days)", help: "Stored message bodies older than this are purged.", min: 7, max: 1095 },
  { key: "autodm.human_agent_tag.enabled", type: "bool", default: false, group: "features", label: "Human Agent tag (7-day DM window)", help: "Off by default. Only enable if your Meta app has the Human Agent feature approved." },
  { key: "autodm.allowed_user_scope", type: "enum", default: "all", group: "rollout", label: "Who can use AutoDM", help: "all, admins_only, or allowlist (staged rollout / testing).", options: ["all", "admins_only", "allowlist"] },
  { key: "autodm.allowlist_user_ids", type: "idlist", default: [], group: "rollout", label: "Allowlisted partner ids", help: "Used when the scope is allowlist. One partner id per line." },
];

export const SETTING_KEYS = SETTING_DEFS.map((d) => d.key);
export const defOf = (key: string): SettingDef | undefined => SETTING_DEFS.find((d) => d.key === key);

export type SettingValue = boolean | number | string | string[];
export type SettingsMap = Record<string, SettingValue>;

export const defaultSettings = (): SettingsMap => Object.fromEntries(SETTING_DEFS.map((d) => [d.key, Array.isArray(d.default) ? [...d.default] : d.default]));

/** Validates and normalises a value for a key. Returns {ok:false} instead of throwing. */
export function coerceSetting(key: string, raw: unknown): { ok: true; value: SettingValue } | { ok: false; error: string } {
  const def = defOf(key);
  if (!def) return { ok: false, error: "Unknown setting" };
  switch (def.type) {
    case "bool":
      if (typeof raw === "boolean") return { ok: true, value: raw };
      return { ok: false, error: "Expected true or false" };
    case "int": {
      const n = typeof raw === "string" ? Number(raw) : raw;
      if (typeof n !== "number" || !Number.isInteger(n)) return { ok: false, error: "Expected a whole number" };
      if (def.min !== undefined && n < def.min) return { ok: false, error: `Minimum is ${def.min}` };
      if (def.max !== undefined && n > def.max) return { ok: false, error: `Maximum is ${def.max}` };
      return { ok: true, value: n };
    }
    case "enum":
      return typeof raw === "string" && def.options?.includes(raw) ? { ok: true, value: raw } : { ok: false, error: `Must be one of: ${def.options?.join(", ")}` };
    case "idlist": {
      if (!Array.isArray(raw)) return { ok: false, error: "Expected a list" };
      const ids = raw.map((v) => String(v).trim()).filter(Boolean);
      if (ids.length > 500 || ids.some((v) => !/^[a-f0-9]{24}$/i.test(v))) return { ok: false, error: "Each id must be a 24-character partner id (max 500)" };
      return { ok: true, value: [...new Set(ids)] };
    }
  }
}

/** Merges stored rows over the defaults; invalid stored values fall back to the default. */
export function resolveSettings(rows: { key: string; value: unknown }[]): SettingsMap {
  const out = defaultSettings();
  for (const r of rows) {
    const c = coerceSetting(r.key, r.value);
    if (c.ok) out[r.key] = c.value;
  }
  return out;
}

export type Scope = "all" | "admins_only" | "allowlist";

/** Who may use AutoDM at all. Admins always pass. */
export function scopeAllows(scope: string, allowlist: string[], user: { id: string; isAdmin?: boolean }): boolean {
  if (user.isAdmin) return true;
  if (scope === "all") return true;
  if (scope === "allowlist") return allowlist.includes(user.id);
  return false;
}
