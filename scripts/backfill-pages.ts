/**
 * Generates and saves a landing page config for partners that don't have one yet.
 *
 *   pnpm backfill              random layout/content/theme per partner (seeded, saved once)
 *   pnpm backfill --legacy     variant 1 + original copy everywhere: pages look exactly as before
 *   pnpm backfill --force      also overwrite partners that already have a config
 *
 * Safe to re-run: partners that already have a config are skipped unless --force is given.
 */
import { dbConnect } from "../lib/db";
import { Partner, type IPartner } from "../lib/models/Partner";
import { generatePartnerPage } from "../lib/page-builder/generate";
import { hasPageConfig, pageConfigUpdate } from "../lib/page-builder/persist";

async function main() {
  const legacy = process.argv.includes("--legacy");
  const force = process.argv.includes("--force");

  await dbConnect();
  const partners = await Partner.find({}).lean<IPartner[]>();

  let updated = 0;
  let skipped = 0;
  for (const partner of partners) {
    if (!force && hasPageConfig(partner)) {
      skipped++;
      continue;
    }
    const config = generatePartnerPage(partner, { legacy });
    await Partner.updateOne({ _id: partner._id }, { $set: pageConfigUpdate(config) });
    updated++;
    console.log(`  /${partner.slug}  seed=${config.seed}  hero=${config.layoutConfig.hero}  order=${config.sectionOrder.length} sections`);
  }

  console.log(`Backfill complete${legacy ? " (legacy)" : ""}: ${updated} updated, ${skipped} already had a config.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
