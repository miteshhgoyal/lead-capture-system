import { z } from "zod";

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "dashboard",
  "_next",
  "static",
  "assets",
  "favicon",
  "favicon.ico",
  "robots",
  "robots.txt",
  "sitemap",
  "sitemap.xml",
  "thank-you",
  "uploads",
  "public",
  "settings",
  "direct",
  "lead",
  "leads",
  "partner",
  "partners",
  "privacy",
  "terms",
  "about",
  "contact",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim());
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export const HexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const PartnerSchema = z.object({
  name: z.string().trim().min(2, "Partner name is required").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
    .refine((s) => !isReservedSlug(s), {
      message: "This slug is reserved and cannot be used",
    }),
  telegramLink: z
    .string()
    .trim()
    .url("Please enter a valid Telegram link (e.g. https://t.me/...)"),
  whatsappGroupLink: z
    .string()
    .trim()
    .url("Please enter a valid WhatsApp link")
    .or(z.literal(""))
    .optional(),
  zoomLink: z
    .string()
    .trim()
    .url("Please enter a valid Zoom link")
    .or(z.literal(""))
    .optional(),
  isActive: z.boolean().default(true),
  tagline: z.string().trim().max(200).optional(),
  mentorBio: z.string().trim().max(1000).optional(),
  logoUrl: z.string().trim().optional(),
  faviconUrl: z.string().trim().optional(),
  theme: z
    .object({
      primaryColor: z.string().regex(HexColorRegex, "Invalid hex color").default("#3b36e0"),
    })
    .default({ primaryColor: "#3b36e0" }),
});

export type PartnerFormData = z.infer<typeof PartnerSchema>;
