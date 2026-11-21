import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison (different lengths compare false without leaking where they differ). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString("hex");

/** X-Hub-Signature-256 check: `sha256=<hex hmac of the raw body>` with any of the candidate secrets. */
export function verifyHubSignature(rawBody: string | Buffer, header: string | null | undefined, secrets: string[]): boolean {
  if (!header || !header.startsWith("sha256=") || secrets.length === 0) return false;
  const got = header.slice(7);
  return secrets.some((s) => safeEqual(createHmac("sha256", s).update(rawBody).digest("hex"), got));
}

export const signHub = (rawBody: string | Buffer, secret: string): string => `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

/**
 * Meta `signed_request` (deauthorize / data deletion): `<sig>.<payload>` in base64url, sig = HMAC-SHA256(payload, app secret).
 * Returns the decoded payload or null when invalid.
 */
export function parseSignedRequest(signed: string, secrets: string[]): Record<string, unknown> | null {
  const [sig, payload] = (signed ?? "").split(".");
  if (!sig || !payload) return null;
  const ok = secrets.some((s) => safeEqual(createHmac("sha256", s).update(payload).digest("base64url"), sig));
  if (!ok) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as unknown;
    return data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function makeSignedRequest(data: object, secret: string): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${createHmac("sha256", secret).update(payload).digest("base64url")}.${payload}`;
}
