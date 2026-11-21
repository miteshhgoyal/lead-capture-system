import { z } from "zod";
import { HexColorRegex, PartnerSchema } from "./partner";

/** Partner-supplied links end up as href on a public page: allow only http(s), never javascript: etc. */
const httpUrl = (msg: string) =>
  z
    .string()
    .trim()
    .url(msg)
    .refine((u) => /^https?:\/\//i.test(u), "Link must start with http:// or https://");

const optionalHttpUrl = (msg: string) => httpUrl(msg).or(z.literal("")).optional();

/** Logo must be one of our uploads (/uploads/...) or an https image URL (Cloudinary). */
const logoUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => u === "" || /^\/uploads\/[\w.-]+$/.test(u) || /^https:\/\//i.test(u), "Invalid logo URL")
  .optional();

export const loginIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Login ID must be at least 3 characters")
  .max(60, "Login ID is too long")
  .regex(/^[a-z0-9._@+-]+$/, "Login ID can use letters, numbers and . _ @ + - only");

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(100, "Password is too long");

const profileFields = {
  telegramLink: httpUrl("Please enter a valid Telegram link (e.g. https://t.me/...)"),
  whatsappGroupLink: optionalHttpUrl("Please enter a valid WhatsApp link"),
  tagline: z.string().trim().max(200).optional(),
  mentorBio: z.string().trim().max(1000).optional(),
  logoUrl,
  primaryColor: z.string().regex(HexColorRegex, "Invalid hex color"),
};

/** Public self sign-up. */
export const PartnerSignupSchema = z.object({
  name: PartnerSchema.shape.name,
  slug: PartnerSchema.shape.slug,
  loginId: loginIdSchema,
  password: passwordSchema,
  ...profileFields,
  primaryColor: profileFields.primaryColor.default("#3b36e0"),
  hp_company: z.string().optional(), // honeypot
});

/** A partner editing their own page. Slug / isActive are deliberately not editable here. */
export const PartnerSelfUpdateSchema = z
  .object({
    name: PartnerSchema.shape.name,
    ...profileFields,
    currentPassword: z.string().max(100).optional(),
    newPassword: passwordSchema.optional(),
  })
  .partial();

/** Admin sets / resets portal access. */
export const AdminCredentialsSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema.optional(),
});
