import { dbConnect } from "@/lib/db";
import { config } from "./config";
import { AutodmAudit, AutodmSetting } from "./models";
import { computeReadiness } from "./readiness";
import { coerceSetting, defaultSettings, resolveSettings, scopeAllows, type SettingsMap, type SettingValue } from "./settings-defs";

export class GateError extends Error {
  readonly status: number;
  readonly extra?: object;
  constructor(status: number, message: string, extra?: object) {
    super(message);
    this.name = "GateError";
    this.status = status;
    this.extra = extra;
  }
}

const TTL_MS = 5000;
const g = globalThis as unknown as { _autodmSettings?: { at: number; map: SettingsMap } };

/**
 * FeatureGate: the single place flags are read. Flags are read at request/job time (5 s cache, dropped on every
 * write in this process), so toggling takes effect without a redeploy.
 */
export const FeatureGate = {
  async all(force = false): Promise<SettingsMap> {
    const hit = g._autodmSettings;
    if (!force && hit && Date.now() - hit.at < TTL_MS) return hit.map;
    let map: SettingsMap;
    try {
      await dbConnect();
      map = resolveSettings(await AutodmSetting.find({}).lean());
    } catch (e) {
      console.error("[autodm] settings unavailable, using defaults (feature dark):", (e as Error).message);
      map = defaultSettings();
    }
    g._autodmSettings = { at: Date.now(), map };
    return map;
  },
  invalidate() {
    g._autodmSettings = undefined;
  },
  async isEnabled(key: string): Promise<boolean> {
    const s = await this.all();
    if (key !== "autodm.enabled" && s["autodm.enabled"] !== true) return false;
    return s[key] === true;
  },
  /** Throws GateError 404 when the master switch is off, 403 when a feature flag is off. */
  async assertEnabled(key: string): Promise<void> {
    const s = await this.all();
    if (s["autodm.enabled"] !== true) throw new GateError(404, "Not found");
    if (key !== "autodm.enabled" && s[key] !== true) throw new GateError(403, "This feature is currently disabled by the administrator.");
  },
  async userAllowed(user: { id: string; isAdmin?: boolean }): Promise<boolean> {
    const s = await this.all();
    return scopeAllows(String(s["autodm.allowed_user_scope"]), (s["autodm.allowlist_user_ids"] as string[]) ?? [], user);
  },
  /** Validates, enforces readiness for the master switch, writes the setting and the audit row. */
  async set(key: string, raw: unknown, actor: string, ip: string, opts: { devOverride?: boolean } = {}): Promise<SettingValue> {
    const c = coerceSetting(key, raw);
    if (!c.ok) throw new GateError(400, c.error);
    const before = (await this.all(true))[key];
    if (key === "autodm.enabled" && c.value === true) {
      const r = computeReadiness();
      const override = opts.devOverride === true && !config().isProduction;
      if (!r.ready && !override) throw new GateError(409, "Required environment values are missing, so AutoDM cannot be turned on yet.", { missing: r.missing.map((m) => ({ key: m.key, label: m.label })) });
    }
    await dbConnect();
    await AutodmSetting.updateOne({ key }, { $set: { value: c.value, updatedBy: actor } }, { upsert: true });
    await AutodmAudit.create({ actor, action: "setting.update", key, oldValue: before, newValue: c.value, ip });
    this.invalidate();
    return c.value;
  },
};

/** Whether AutoDM is visible to this partner (nav link + pages). */
export async function autodmVisibleTo(partnerId: string): Promise<boolean> {
  const s = await FeatureGate.all();
  return s["autodm.enabled"] === true && (await FeatureGate.userAllowed({ id: partnerId }));
}
