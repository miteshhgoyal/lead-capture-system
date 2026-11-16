import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IPartnerTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
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
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const partnerThemeSchema = new Schema<IPartnerTheme>(
  {
    primaryColor: { type: String, default: "#3b36e0" },
    secondaryColor: { type: String, default: "#7a5cff" },
    accentColor: { type: String, default: "#3b36e0" },
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
    createdBy: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

partnerSchema.index({ slug: 1 }, { unique: true });
partnerSchema.index({ isActive: 1, createdAt: -1 });

export const Partner: Model<IPartner> =
  (models.Partner as Model<IPartner> | undefined) ?? model<IPartner>("Partner", partnerSchema);
