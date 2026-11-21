const SENSITIVE_KEY = /token|secret|authorization|signature|password|cookie|code$/i;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Deep copy with token-like keys replaced and e-mail addresses masked. Used before showing payloads to admins. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[deep]";
  if (typeof value === "string") return value.replace(EMAIL, (m) => `${m.slice(0, 2)}***@***`).slice(0, 2000);
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = SENSITIVE_KEY.test(k) ? "[redacted]" : redact(v, depth + 1);
    return out;
  }
  return value;
}
