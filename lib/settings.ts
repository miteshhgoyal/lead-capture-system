import { dbConnect } from "./db";
import { SiteSettings, type ISiteSettings } from "./models/SiteSettings";
import { DEFAULT_SETTINGS, type SiteSettingsData } from "./defaults";

export async function getSettings(): Promise<SiteSettingsData> {
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key: "main" }).lean<ISiteSettings | null>();
    if (!doc) {
      return DEFAULT_SETTINGS;
    }
    return {
      headline: doc.headline || DEFAULT_SETTINGS.headline,
      subheadline: doc.subheadline || DEFAULT_SETTINGS.subheadline,
      trustLine: doc.trustLine || DEFAULT_SETTINGS.trustLine,
      defaultTelegramLink: doc.defaultTelegramLink || DEFAULT_SETTINGS.defaultTelegramLink,
      defaultWhatsappLink: doc.defaultWhatsappLink || "",
      defaultZoomLink: doc.defaultZoomLink || "",
      defaultMentorName: doc.defaultMentorName || DEFAULT_SETTINGS.defaultMentorName,
      defaultMentorBio: doc.defaultMentorBio || DEFAULT_SETTINGS.defaultMentorBio,
      brandName: doc.brandName || DEFAULT_SETTINGS.brandName,
      brandTagline: doc.brandTagline || DEFAULT_SETTINGS.brandTagline,
      logoUrl: doc.logoUrl || DEFAULT_SETTINGS.logoUrl,
      primaryColor: doc.primaryColor || "",
      faqs: doc.faqs && doc.faqs.length > 0 ? doc.faqs : DEFAULT_SETTINGS.faqs,
      disclaimer: doc.disclaimer || DEFAULT_SETTINGS.disclaimer,
      analytics: doc.analytics || DEFAULT_SETTINGS.analytics,
    };
  } catch (error) {
    console.error("[getSettings] DB read failed, falling back to defaults:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(data: Partial<SiteSettingsData>): Promise<SiteSettingsData> {
  await dbConnect();
  const updated = await SiteSettings.findOneAndUpdate(
    { key: "main" },
    { $set: data },
    { new: true, upsert: true }
  ).lean<ISiteSettings>();

  return {
    headline: updated.headline,
    subheadline: updated.subheadline,
    trustLine: updated.trustLine,
    defaultTelegramLink: updated.defaultTelegramLink,
    defaultWhatsappLink: updated.defaultWhatsappLink || "",
    defaultZoomLink: updated.defaultZoomLink || "",
    defaultMentorName: updated.defaultMentorName,
    defaultMentorBio: updated.defaultMentorBio,
    brandName: updated.brandName,
    brandTagline: updated.brandTagline,
    logoUrl: updated.logoUrl,
    primaryColor: updated.primaryColor || "",
    faqs: updated.faqs,
    disclaimer: updated.disclaimer,
    analytics: updated.analytics,
  };
}
