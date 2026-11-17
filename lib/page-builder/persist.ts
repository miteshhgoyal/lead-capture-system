import { Types } from "mongoose";
import { dbConnect } from "../db";
import { Partner, type IPartner } from "../models/Partner";
import { SiteSettings, type ISiteSettings } from "../models/SiteSettings";
import { generatePartnerPage, type GenerateOptions } from "./generate";
import type { PartnerPageConfig } from "./types";
import { hasPageConfig } from "./validate";

function toUpdate(config: PartnerPageConfig) {
  return {
    seed: config.seed,
    layoutConfig: config.layoutConfig,
    contentConfig: config.contentConfig,
    themeConfig: config.themeConfig,
    sectionOrder: config.sectionOrder,
  };
}

/**
 * Render-time fallback: if a partner has no config yet, generate one and save it exactly once.
 * The write is conditional, so two concurrent first requests cannot overwrite each other;
 * whichever write lost simply reads the winner's config back.
 */
export async function ensurePartnerPage(partner: IPartner): Promise<PartnerPageConfig> {
  if (hasPageConfig(partner)) return partner;

  const generated = generatePartnerPage(partner);
  await dbConnect();
  const res = await Partner.updateOne(
    { _id: partner._id, $or: [{ seed: null }, { seed: { $exists: false } }, { layoutConfig: null }, { contentConfig: null }] },
    { $set: toUpdate(generated) }
  );
  if (res.modifiedCount > 0) return generated;

  const fresh = await Partner.findById(partner._id).lean<IPartner | null>();
  return hasPageConfig(fresh) ? fresh : generated;
}

/** Admin action: draws a new seed and overwrites the saved page. Returns the new config. */
export async function regeneratePartnerPage(id: string | Types.ObjectId, options: GenerateOptions = {}): Promise<PartnerPageConfig | null> {
  await dbConnect();
  const partner = await Partner.findById(id).lean<IPartner | null>();
  if (!partner) return null;
  const generated = generatePartnerPage(partner, options);
  await Partner.updateOne({ _id: partner._id }, { $set: toUpdate(generated) });
  return generated;
}

/** The $set payload that stores a generated page on a partner document. */
export { toUpdate as pageConfigUpdate };

/** The root page (`/`): the saved page from site settings, or null to keep the original design. */
export async function getRootPage(): Promise<PartnerPageConfig | null> {
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key: "main" }).lean<ISiteSettings | null>();
    return hasPageConfig(doc) ? toUpdate(doc) : null;
  } catch (error) {
    console.error("[getRootPage] DB read failed, using the original design:", error);
    return null;
  }
}

/** Admin action: shuffles the root page. `legacy` restores the original design. */
export async function regenerateRootPage(options: GenerateOptions = {}): Promise<PartnerPageConfig> {
  await dbConnect();
  const generated = generatePartnerPage({}, options);
  await SiteSettings.updateOne({ key: "main" }, { $set: toUpdate(generated) }, { upsert: true });
  return generated;
}
