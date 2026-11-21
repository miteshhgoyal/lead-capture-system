/** Masking for lead contact details shown to partners. Raw email / phone never leave the server. */

export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  if (!domain) return "****";
  const dot = domain.lastIndexOf(".");
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  return `${user.slice(0, 1)}***@${host.slice(0, 1)}***${tld}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "****";
  return `${phone.startsWith("+") ? "+" : ""}${digits.slice(0, 2)}******${digits.slice(-2)}`;
}
