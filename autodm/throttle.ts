/** Per-key sliding-window throttle (in-process). The DB daily cap is the cross-instance safety net. */
export function createThrottle(maxCalls: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return {
    /** Returns {ok:true} and records the call, or {ok:false, retryAfterMs}. */
    tryAcquire(key: string, now: number = Date.now()): { ok: boolean; retryAfterMs: number } {
      const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (list.length >= maxCalls) {
        hits.set(key, list);
        return { ok: false, retryAfterMs: Math.max(250, windowMs - (now - list[0])) };
      }
      list.push(now);
      hits.set(key, list);
      return { ok: true, retryAfterMs: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

/** Global backoff after Meta answers with a rate-limit error: no sends for this account until the time passes. */
export function createBackoffRegistry() {
  const until = new Map<string, number>();
  return {
    set(key: string, ms: number, now: number = Date.now()) {
      until.set(key, now + ms);
    },
    remaining(key: string, now: number = Date.now()): number {
      const t = until.get(key) ?? 0;
      return t > now ? t - now : 0;
    },
  };
}
