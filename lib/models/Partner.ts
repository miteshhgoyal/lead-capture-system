import { Schema, model, models, type Model, type Types } from "mongoose";
import type {
  ContentConfig,
  LayoutConfig,
  PartnerTestimonial,
  SectionKey,
  ThemeConfig,
} from "../page-builder/types";

export interface IPartnerTheme {
  /** The partner's single brand colour. Every other tone is derived from it. */
  primaryColor: string;
}

export interface IPartner {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  telegramLink: string;
  whatsappGroupLink?: string;
  zoomLink?: string;
  isActive: boolean;
  tagline?: string;
  mentorBio?: string;
  logoUrl?: string;
  faviconUrl?: string;
  theme: IPartnerTheme;
  testimonials?: PartnerTestimonial[];
  /** Generated once per partner (see lib/page-builder/generate.ts) and read on every render. */
  layoutConfig?: LayoutConfig | null;
  contentConfig?: ContentConfig | null;
  themeConfig?: ThemeConfig | null;
  sectionOrder?: SectionKey[] | null;
  seed?: number | null;
  createdBy?: string;
  /** Partner portal login id (lowercase). Absent for partners that have no portal access yet. */
  /** Business share (0-100) of the revenue from this partner's leads. Admin-only: no partner-facing route writes it. */
  sharePercent?: number;
  loginId?: string;
  /** scrypt hash (salt:key). Never selected by default: use `.select("+passwordHash")`. */
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnerThemeSchema = new Schema<IPartnerTheme>(
  {
    primaryColor: { type: String, default: "#3b36e0" },
  },
  { _id: false }
);

const testimonialSchema = new Schema<PartnerTestimonial>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    quote: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const partnerSchema = new Schema<IPartner>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    telegramLink: { type: String, required: true, trim: true },
    whatsappGroupLink: { type: String, trim: true },
    zoomLink: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    tagline: { type: String, trim: true },
    mentorBio: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    faviconUrl: { type: String, trim: true },
    theme: { type: partnerThemeSchema, default: () => ({}) },
    testimonials: { type: [testimonialSchema], default: [] },
    layoutConfig: { type: Schema.Types.Mixed, default: null },
    contentConfig: { type: Schema.Types.Mixed, default: null },
    themeConfig: { type: Schema.Types.Mixed, default: null },
    sectionOrder: { type: Schema.Types.Mixed, default: null },
    seed: { type: Number, default: null },
    createdBy: { type: String, trim: true },
    sharePercent: { type: Number, default: 0, min: 0, max: 100 },
    loginId: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
  },
  {
    timestamps: true,
  }
);

partnerSchema.index({ slug: 1 }, { unique: true });
partnerSchema.index({ isActive: 1, createdAt: -1 });
// Partial index (not sparse) so partners without a loginId never collide.
partnerSchema.index({ loginId: 1 }, { unique: true, partialFilterExpression: { loginId: { $type: "string" } } });

export const Partner: Model<IPartner> =
  (models.Partner as Model<IPartner> | undefined) ?? model<IPartner>("Partner", partnerSchema);
