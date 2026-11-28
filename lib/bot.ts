/**
 * HTTP client for the Telegram broadcast bot (see docs/CRM_INTEGRATION.md).
 * Server-only: it carries BOT_API_KEY. Never import it from a client component.
 */

export class BotError extends Error {
  /** HTTP status from the bot, or 0 when the bot could not be reached / timed out. */
  readonly status: number;
  /** Error code from the bot body (`unknown_group`, `rate_limited`, ...) or a local one. */
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "BotError";
    this.status = status;
    this.code = code;
  }

  /** Worth retrying with the same request: the bot may still succeed. */
  get transient(): boolean {
    return this.status === 0 || this.status === 409 || this.status === 429 || this.status >= 500;
  }
}

function botEnv(): { base: string; key: string } {
  const base = (process.env.BOT_API_URL ?? "").trim().replace(/\/+$/, "");
  const key = (process.env.BOT_API_KEY ?? "").trim();
  if (!base || !key) throw new BotError(0, "bot_not_configured");
  return { base, key };
}

async function call<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const { base, key } = botEnv();
  const { timeoutMs = 20_000, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...rest,
      headers: { "Content-Type": "application/json", "X-API-Key": key, ...(rest.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new BotError(0, timedOut ? "bot_timeout" : "bot_unreachable");
  }
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & Record<string, unknown>;
  if (!res.ok || body.ok !== true) throw new BotError(res.status, typeof body.error === "string" ? body.error : `bot_${res.status}`);
  return body as T;
}

export const rewrite = (text: string, style: string) =>
  call<{ text: string; unchanged?: boolean }>("/rewrite", {
    method: "POST",
    body: JSON.stringify({ text, style }),
    timeoutMs: 45_000,
  });

/** Idempotent on `requestId`: retrying the same id never posts twice. */
export const sendToGroup = (chatId: string, text: string, requestId: string) =>
  call<{ message_id: number }>("/send", {
    method: "POST",
    body: JSON.stringify({ chat_id: chatId, text, request_id: requestId }),
    timeoutMs: 20_000,
  });

export const groupInfo = (chatId: string) =>
  call<{ title: string; members: number; status: string; can_post: boolean }>(`/groups/${encodeURIComponent(chatId)}`, { timeoutMs: 10_000 });

export const leaveGroup = (chatId: string) =>
  call<{ ok: true }>(`/groups/${encodeURIComponent(chatId)}/leave`, { method: "POST", timeoutMs: 10_000 });

export function connectLink(token: string): string {
  const username = (process.env.BOT_USERNAME ?? "").trim().replace(/^@/, "");
  if (!username) throw new BotError(0, "bot_not_configured");
  return `https://t.me/${username}?startgroup=${token}&admin=post_messages`;
}
