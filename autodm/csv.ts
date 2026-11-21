/** CSV cell: quoted, and neutralised against spreadsheet formula injection (leading = + - @ tab CR). */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export const csvLine = (cells: unknown[]): string => cells.map(csvCell).join(",");
export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

/** First plausible e-mail address in a message, lower-cased, or null. */
export function extractEmail(text: string): string | null {
  const m = (text ?? "").match(/[^\s@<>()]{1,64}@[^\s@<>()]{1,190}\.[^\s@<>()]{2,}/);
  return m && EMAIL_RE.test(m[0]) ? m[0].toLowerCase() : null;
}
