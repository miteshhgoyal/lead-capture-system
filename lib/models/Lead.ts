import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ILead {
  _id: Types.ObjectId;
  name: string;
  phone: string; // E.164 normalized
  countryCode: string;
  email: string;
  age: number;
  profession: string;
  capital: string;
  country: string;

  // Partner tagging
  partnerId?: Types.ObjectId | null;
  partnerSlug: string;
  partnerName: string;
  source: "partner-page" | "direct";

  // Attribution
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landingUrl?: string;

  // Technical metadata
  ip?: string;
  userAgent?: string;
  device?: "desktop" | "mobile" | "tablet";

  // CRM
  status: "new" | "contacted" | "joined" | "not-interested";
  notes?: string;
  isDuplicate: boolean;
  duplicateCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    countryCode: { type: String, default: "+91", trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    age: { type: Number, required: true, min: 18, max: 80 },
    profession: { type: String, required: true, trim: true },
    capital: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },

    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", index: true },
    partnerSlug: { type: String, required: true, trim: true, index: true },
    partnerName: { type: String, required: true, trim: true },
    source: { type: String, enum: ["partner-page", "direct"], default: "direct", index: true },

    utm_source: { type: String, trim: true },
    utm_medium: { type: String, trim: true },
    utm_campaign: { type: String, trim: true },
    utm_term: { type: String, trim: true },
    utm_content: { type: String, trim: true },
    referrer: { type: String, trim: true },
    landingUrl: { type: String, trim: true },

    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    device: { type: String, enum: ["desktop", "mobile", "tablet"], default: "desktop" },

    status: {
      type: String,
      enum: ["new", "contacted", "joined", "not-interested"],
      default: "new",
      index: true,
    },
    notes: { type: String, default: "", trim: true },
    isDuplicate: { type: Boolean, default: false, index: true },
    duplicateCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// High-speed compound indexes for queries and duplicate lookups
leadSchema.index({ partnerSlug: 1, phone: 1 });
leadSchema.index({ partnerSlug: 1, email: 1 });
leadSchema.index({ partnerSlug: 1, createdAt: -1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });

export const Lead: Model<ILead> =
  (models.Lead as Model<ILead> | undefined) ?? model<ILead>("Lead", leadSchema);
