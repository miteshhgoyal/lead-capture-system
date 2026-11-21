import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://freecourselink.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/admin", "/api/", "/partner/portal", "/partner/login", "/autodm/"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
