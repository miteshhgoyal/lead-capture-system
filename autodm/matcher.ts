import type { AutomationLike, MatchType, NormalizedEvent, TriggerType } from "./types";

export const normText = (s: string, caseSensitive: boolean): string => {
  const n = (s ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
  return caseSensitive ? n : n.toLowerCase();
};

/** Which automation trigger types can react to an event. */
export function triggersFor(kind: NormalizedEvent["kind"]): TriggerType[] {
  switch (kind) {
    case "comment": return ["comment"];
    case "story_reply": return ["story_reply"];
    case "story_mention": return ["story_mention"];
    case "dm": return ["dm_keyword", "dm_default"];
    default: return [];
  }
}

/** The longest keyword that matches, or null. `any` always matches (empty string). */
export function matchKeyword(text: string, keywords: string[], matchType: MatchType, caseSensitive: boolean): string | null {
  if (matchType === "any") return "";
  const t = normText(text, caseSensitive);
  let best: string | null = null;
  for (const k of keywords) {
    const kw = normText(k, caseSensitive);
    if (!kw) continue;
    const hit = matchType === "exact" ? t === kw : t.includes(kw);
    if (hit && (best === null || kw.length > best.length)) best = kw;
  }
  return best;
}

/**
 * Picks at most one active automation for the event. Specific post beats "all posts", exact beats contains,
 * a longer keyword beats a shorter one, and the oldest automation wins a tie (stable).
 */
export function pickAutomation(event: NormalizedEvent, automations: AutomationLike[], now: Date = new Date()): AutomationLike | null {
  const triggers = triggersFor(event.kind);
  if (!triggers.length) return null;
  const scored: { a: AutomationLike; score: number }[] = [];
  let defaultReply: AutomationLike | null = null;

  for (const a of automations) {
    if (a.status !== "active" || !triggers.includes(a.triggerType)) continue;
    if (a.startsAt && now < a.startsAt) continue;
    if (a.endsAt && now > a.endsAt) continue;

    if (a.triggerType === "dm_default") {
      if (!defaultReply || a.createdAt < defaultReply.createdAt) defaultReply = a;
      continue;
    }
    let score = 0;
    if (a.triggerType === "comment") {
      if (a.mediaId && a.mediaId !== event.mediaId) continue;
      if (a.mediaId) score += 100;
    }
    // Story mentions carry no text, so keywords never apply to them.
    const matchType: MatchType = a.triggerType === "story_mention" ? "any" : a.matchType;
    const kw = matchKeyword(event.text, a.keywordList, matchType, a.caseSensitive);
    if (kw === null) continue;
    score += matchType === "exact" ? 20 : matchType === "contains" ? 10 : 0;
    score += Math.min(9, kw.length / 10);
    scored.push({ a, score });
  }
  scored.sort((x, y) => y.score - x.score || x.a.createdAt.getTime() - y.a.createdAt.getTime());
  return scored[0]?.a ?? defaultReply;
}
