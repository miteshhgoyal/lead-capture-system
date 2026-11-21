/** https-only URL check that blocks localhost, private/link-local ranges, and credentials in the URL. */
export function isSafeHttpsUrl(input: string): boolean {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host.includes(".") && !host.includes(":")) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".lan")) return false;
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  if (host.includes(":")) {
    // IPv6 literal: only allow public-looking global unicast (2000::/3); block everything else.
    if (!/^[23]/.test(host)) return false;
  }
  return true;
}
