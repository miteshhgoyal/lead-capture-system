import type { MetadataRoute } from "next";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://onestockacademy.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  try {
    await dbConnect();
    const activePartners = await Partner.find({ isActive: true }, { slug: 1, updatedAt: 1 }).lean();

    const partnerRoutes: MetadataRoute.Sitemap = activePartners.map((p) => ({
      url: `${siteUrl}/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...partnerRoutes];
  } catch (error) {
    console.error("[sitemap] Failed to fetch partner routes:", error);
    return staticRoutes;
  }
}
