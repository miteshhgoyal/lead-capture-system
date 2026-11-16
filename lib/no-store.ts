/** Headers for live data that must never be cached by browsers, proxies or CDNs. */
export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "CDN-Cache-Control": "no-store",
  Pragma: "no-cache",
  Expires: "0",
};
