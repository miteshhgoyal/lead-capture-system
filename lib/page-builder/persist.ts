import { Types } from "mongoose";
import { dbConnect } from "../db";
import { Partner, type IPartner } from "../models/Partner";
import { generatePartnerPage, type GenerateOptions } from "./generate";
import { SECTION_KEYS, type PartnerPageConfig } from "./types";

type StoredPage = Pick<IPartner, "layoutConfig" | "contentConfig" | "themeConfig" | "sectionOrder" | "seed">;

/** True when a partner document carries a complete generated page config. */
export function hasPageConfig(p: Partial<StoredPage> | null | undefined): p is PartnerPageConfig {
  if (!p || typeof p.seed !== "number") return false;
  if (!p.layoutConfig || !p.contentConfig || !p.themeConfig) return false;
  if (!Array.isArray(p.sectionOrder) || p.sectionOrder.length === 0) return false;
  return SECTION_KEYS.every((k) => p.layoutConfig?.[k] && p.contentConfig?.[k]) && !!p.contentConfig.meta;
}

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

export { toUpdate as pageConfigUpdate };
