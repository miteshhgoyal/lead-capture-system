import { z } from "zod";

export const CAPITAL_OPTIONS = [
  "Up to ₹1,00,000",
  "₹1L–₹5L",
  "₹5L–₹10L",
  "₹10L+",
  "Just starting / not yet",
] as const;

export const PROFESSION_OPTIONS = [
  "Student",
  "Salaried",
  "Business",
  "Self-employed",
  "Homemaker",
  "Retired",
  "Other",
] as const;

export const LEAD_STATUS_OPTIONS = [
  "new",
  "contacted",
  "joined",
  "not-interested",
] as const;

export type LeadStatus = (typeof LEAD_STATUS_OPTIONS)[number];

/** Normalize any raw phone input to E.164 format */
export function normalizePhone(rawPhone: string, defaultCountryCode: string = "+91"): string {
  if (!rawPhone) return "";
  let cleaned = rawPhone.replace(/[^\d+]/g, "").trim();

  // If already starts with '+', ensure digits follow
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return `+${digits}`;
  }

  // Remove leading 0s often entered in India/UK/etc.
  cleaned = cleaned.replace(/^0+/, "");

  // If country code doesn't have '+', add it
  const cCode = defaultCountryCode.startsWith("+") ? defaultCountryCode : `+${defaultCountryCode}`;
  const cCodeDigits = cCode.replace(/\D/g, "");

  // If the number already starts with the country code digits (e.g. 919876543210 for +91)
  if (cleaned.startsWith(cCodeDigits) && cleaned.length > cCodeDigits.length + 6) {
    return `+${cleaned}`;
  }

  return `${cCode}${cleaned}`;
}

export const LeadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  countryCode: z.string().trim().default("+91"),
  phone: z
    .string()
    .trim()
    .min(6, "Please enter a valid phone number")
    .max(20, "Phone number is too long"),
  capital: z.enum(CAPITAL_OPTIONS),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid Gmail / Email address"),
  age: z.coerce
    .number()
    .int("Age must be a whole number")
    .min(18, "Must be at least 18 years old")
    .max(80, "Must be 80 or younger"),
  profession: z.enum(PROFESSION_OPTIONS),
  country: z.string().trim().min(2, "Please select a country").default("India"),
  // Honeypot field - bots fill it, humans don't
  hp_company: z.string().optional(),
  // Tracking
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
  referrer: z.string().optional(),
  landingUrl: z.string().optional(),
});

export type LeadFormData = z.infer<typeof LeadFormSchema>;
