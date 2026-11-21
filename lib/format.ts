/** Indian-style money formatting (₹1,00,00,000 and "1.00 Cr"). */
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatINR = (n: number): string => `₹${inr.format(Math.round(n))}`;

export function compactINR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(2)} Lakh`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return String(Math.round(n));
}
