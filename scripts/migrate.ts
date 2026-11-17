/**
 * One-off, idempotent data migrations for the partners collection.
 *
 *   pnpm migrate
 *
 * 1. Drops everything left over from subdomain routing (the `subdomain` field and any index on it).
 * 2. Collapses the old three-colour theme into the single brand colour. The old `accentColor`
 *    was what the landing page actually rendered, so it becomes `theme.primaryColor`.
 *
 * New page-config fields (layoutConfig, contentConfig, themeConfig, sectionOrder, seed) need no
 * migration: existing partners simply have them as null and are filled by `pnpm backfill`.
 */
import { dbConnect } from "../lib/db";
import { Partner } from "../lib/models/Partner";

async function dropSubdomain() {
  // `strict: false` lets us touch paths that are no longer in the schema.
  const res = await Partner.updateMany(
    { $or: [{ subdomain: { $exists: true } }, { subDomain: { $exists: true } }] },
    { $unset: { subdomain: "", subDomain: "" } },
    { strict: false }
  );
  console.log(`subdomain: cleared field on ${res.modifiedCount} partner(s)`);

  const collection = Partner.collection as unknown as { dropIndex(name: string): Promise<unknown> };
  const indexes = await Partner.listIndexes();
  for (const idx of indexes) {
    const keys = Object.keys(idx.key ?? {});
    if (idx.name && keys.some((k) => k.toLowerCase().includes("subdomain"))) {
      await collection.dropIndex(idx.name);
      console.log(`subdomain: dropped index ${idx.name}`);
    }
  }
}

async function collapseTheme() {
  const res = await Partner.updateMany(
    { $or: [{ "theme.accentColor": { $exists: true } }, { "theme.secondaryColor": { $exists: true } }] },
    [
      { $set: { "theme.primaryColor": { $ifNull: ["$theme.accentColor", "$theme.primaryColor"] } } },
      { $unset: ["theme.accentColor", "theme.secondaryColor"] },
    ],
    { strict: false }
  );
  console.log(`theme: collapsed to a single brand colour on ${res.modifiedCount} partner(s)`);
}

async function main() {
  await dbConnect();
  await dropSubdomain();
  await collapseTheme();
  console.log("Migration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
