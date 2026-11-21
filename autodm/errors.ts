/** Internal error taxonomy for Meta calls. */
export type MetaErrorKind = "token_invalid" | "permission_missing" | "rate_limited" | "window_expired" | "user_unreachable" | "duplicate_private_reply" | "not_professional" | "transient" | "unknown";

export class MetaError extends Error {
  readonly kind: MetaErrorKind;
  readonly code?: number;
  readonly status?: number;
  constructor(kind: MetaErrorKind, message: string, opts: { code?: number; status?: number } = {}) {
    super(message);
    this.name = "MetaError";
    this.kind = kind;
    this.code = opts.code;
    this.status = opts.status;
  }
  /** Worth retrying with backoff. */
  get retryable(): boolean {
    return this.kind === "transient" || this.kind === "rate_limited";
  }
}

/**
 * Maps a Graph API error body to our taxonomy. Codes: 190 invalid/expired token, 102 session, 10/200-299 permissions,
 * 4/17/32/613/80002/80006 rate limits, 1/2 transient, 551 user unreachable, 10900 private reply window / 2534014 already replied.
 * RE-VERIFY against https://developers.facebook.com/docs/graph-api/guides/error-handling and the Messaging docs.
 */
export function mapGraphError(status: number, body: unknown): MetaError {
  const err = (body && typeof body === "object" ? (body as { error?: Record<string, unknown> }).error : undefined) ?? {};
  const code = typeof err.code === "number" ? err.code : undefined;
  const sub = typeof err.error_subcode === "number" ? err.error_subcode : undefined;
  const msg = typeof err.message === "string" ? err.message.replace(/(access_token=)[^&\s]+/gi, "$1[redacted]").slice(0, 300) : `HTTP ${status}`;
  const opts = { code, status };
  if (code === 190 || code === 102 || status === 401) return new MetaError("token_invalid", msg, opts);
  if (code === 4 || code === 17 || code === 32 || code === 613 || code === 80002 || code === 80006 || status === 429) return new MetaError("rate_limited", msg, opts);
  if (sub === 2534014 || /already.*repl/i.test(msg)) return new MetaError("duplicate_private_reply", msg, opts);
  if (sub === 2534022 || code === 10900 || /outside of allowed window|24.?hour|7.?day/i.test(msg)) return new MetaError("window_expired", msg, opts);
  if (code === 551 || sub === 1545041 || /not available|unreachable|can't be reached/i.test(msg)) return new MetaError("user_unreachable", msg, opts);
  if (code === 10 || (code !== undefined && code >= 200 && code < 300)) return new MetaError("permission_missing", msg, opts);
  if (status >= 500 || code === 1 || code === 2) return new MetaError("transient", msg, opts);
  return new MetaError("unknown", msg, opts);
}
