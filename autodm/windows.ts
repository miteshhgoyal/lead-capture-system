import { DM_WINDOW_MS, HUMAN_AGENT_WINDOW_MS, PRIVATE_REPLY_WINDOW_MS } from "./config";

/** A Private Reply may go out up to 7 days after the comment (inclusive). */
export function privateReplyAllowed(commentAt: Date | number, now: Date | number = Date.now()): boolean {
  const age = Number(now) - Number(commentAt);
  return age >= 0 && age <= PRIVATE_REPLY_WINDOW_MS;
}

/** A standard DM reply needs an inbound message in the last 24h (7 days with the Human Agent tag). */
export function dmAllowed(lastInboundAt: Date | number | null | undefined, now: Date | number = Date.now(), humanAgent = false): boolean {
  if (lastInboundAt === null || lastInboundAt === undefined) return false;
  const age = Number(now) - Number(lastInboundAt);
  return age >= 0 && age <= (humanAgent ? HUMAN_AGENT_WINDOW_MS : DM_WINDOW_MS);
}

export function backoffMs(attempt: number, base: number, max: number, rand: () => number = Math.random): number {
  const exp = Math.min(max, base * 2 ** Math.max(0, attempt - 1));
  return Math.round(exp / 2 + rand() * (exp / 2)); // "equal jitter"
}
