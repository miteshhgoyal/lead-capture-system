export const BRAND_NAME = "OneStock Academy";
export const BRAND_DOMAIN = "onestockacademy.com";

export function displayBrandName(name?: string | null): string {
  const n = (name ?? "").trim();
  return n || BRAND_NAME;
}
