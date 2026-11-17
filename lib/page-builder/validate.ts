import type { IPartner } from "../models/Partner";
import { SECTION_KEYS, type PartnerPageConfig } from "./types";

type StoredPage = Pick<IPartner, "layoutConfig" | "contentConfig" | "themeConfig" | "sectionOrder" | "seed">;

/** True when a partner document carries a complete generated page config. */
export function hasPageConfig(p: Partial<StoredPage> | null | undefined): p is PartnerPageConfig {
  if (!p || typeof p.seed !== "number") return false;
  if (!p.layoutConfig || !p.contentConfig || !p.themeConfig) return false;
  if (!Array.isArray(p.sectionOrder) || p.sectionOrder.length === 0) return false;
  return SECTION_KEYS.every((k) => p.layoutConfig?.[k] && p.contentConfig?.[k]) && !!p.contentConfig.meta;
}
