export const BRAND_NAME = "Free Course Link";
export const BRAND_DOMAIN = "freecourselink.com";

export function displayBrandName(name?: string | null): string {
  const n = (name ?? "").trim();
  return n || BRAND_NAME;
}
