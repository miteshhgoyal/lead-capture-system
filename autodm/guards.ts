import type { SettingsMap } from "./settings-defs";
import { dmAllowed, privateReplyAllowed } from "./windows";
import type { NormalizedEvent } from "./types";

/**
 * Every reason a run may be skipped. The runner records exactly one of these on the run.
 */
export type SkipReason =
  | "skipped_master_disabled"
  | "skipped_feature_disabled"
  | "skipped_account_inactive"
  | "skipped_sending_disabled"
  | "skipped_daily_cap"
  | "skipped_already_sent"
  | "skipped_window_expired"
  | "skipped_no_recipient";

export interface GuardInput {
  settings: SettingsMap;
  platform: "instagram" | "facebook";
  trigger: "comment" | "story_reply" | "story_mention" | "dm_keyword" | "dm_default";
  action: "private_reply" | "dm" | "public_reply";
  accountStatus: string;
  sentToday: number;
  alreadySentToUser: boolean;
  sendOncePerUser: boolean;
  /** When the comment / inbound message happened. */
  triggerAt: Date | number;
  /** Last inbound DM from this person (for plain DMs). */
  lastInboundAt?: Date | number | null;
  now?: Date | number;
}

const TRIGGER_FLAG: Record<GuardInput["trigger"], string> = {
  comment: "autodm.triggers.comment",
  story_reply: "autodm.triggers.story",
  story_mention: "autodm.triggers.story",
  dm_keyword: "autodm.triggers.dm_keyword",
  dm_default: "autodm.triggers.dm_keyword",
};

export const triggerFlag = (t: GuardInput["trigger"]): string => TRIGGER_FLAG[t];

/**
 * The runner's guard order, as a pure function: master flag, feature flags, account active, sending flag,
 * daily cap, once-per-user, time window. (Idempotency is the unique run key, checked when the run is created.)
 * Returns the first reason to skip, or null when the message may be sent.
 */
export function evaluateGuards(g: GuardInput): SkipReason | null {
  const s = g.settings;
  const now = g.now ?? Date.now();
  if (s["autodm.enabled"] !== true) return "skipped_master_disabled";
  if (s[`autodm.${g.platform}.enabled`] !== true) return "skipped_feature_disabled";
  if (s[TRIGGER_FLAG[g.trigger]] !== true) return "skipped_feature_disabled";
  if (g.action === "public_reply" && s["autodm.public_comment_reply.enabled"] !== true) return "skipped_feature_disabled";
  if (g.accountStatus !== "active") return "skipped_account_inactive";
  if (s["autodm.sending.enabled"] !== true) return "skipped_sending_disabled";
  if (g.action !== "public_reply") {
    if (g.sentToday >= Number(s["autodm.daily_dm_limit_per_account"])) return "skipped_daily_cap";
    if (g.sendOncePerUser && g.alreadySentToUser) return "skipped_already_sent";
  }
  if (g.action === "private_reply" || g.action === "public_reply") {
    if (!privateReplyAllowed(g.triggerAt, now)) return "skipped_window_expired";
  } else if (!dmAllowed(g.lastInboundAt ?? g.triggerAt, now, s["autodm.human_agent_tag.enabled"] === true)) {
    return "skipped_window_expired";
  }
  return null;
}

/** Which send action a trigger produces. There is no code path that sends without an inbound event. */
export function actionFor(kind: NormalizedEvent["kind"]): "private_reply" | "dm" | null {
  if (kind === "comment") return "private_reply";
  if (kind === "story_reply" || kind === "story_mention" || kind === "dm") return "dm";
  return null;
}
