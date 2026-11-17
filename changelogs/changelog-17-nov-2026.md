# Changelog: 17 Nov 2026

## Per-partner randomized landing pages; subdomain routing removed

**Why**: every partner page looked identical. Each partner now gets a generated (and then fixed) layout, copy and theme, and subdomain tenancy is gone so partners resolve only by `/{slug}`.

### Migration
Run once after deploying: `pnpm migrate` (idempotent).
1. Drops the `subdomain` field and any index on it from `partners`.
2. Collapses `theme.{primaryColor,secondaryColor,accentColor}` to `theme.primaryColor`. The old `accentColor` (what pages actually rendered) becomes the brand colour.

Then `pnpm backfill` (random pages) or `pnpm backfill --legacy` (original design for existing partners). Existing partners also get a page generated and saved on first view if you skip this.
Install the icon library if needed: `pnpm add lucide-react`.
Remove `ENABLE_SUBDOMAINS` and `ROOT_DOMAIN` from deployed environments; wildcard DNS/SSL for `*.domain` is no longer used.

### Files created
- `lib/page-builder/{types,prng,theme,pools,resolve,generate,validate,persist}.ts`: generator, pools, theme recipes, persistence.
- `components/landing/sections/{navbar,hero,features,steps,mentor,stats,testimonials,offer,faq,cta,footer,ui,types}.ts(x)`: section variants.
- `components/landing/{registry.tsx,page-context.ts}`, `components/landing/motion/*`: registry, render context, animation system.
- `components/ui/icons.tsx`: icon-name to lucide mapping.
- `components/landing/dev/LayoutsPreview.tsx`, `app/dev/layouts/page.tsx`: dev-only variant gallery.
- `app/api/admin/partners/[id]/regenerate/route.ts`: admin-only page regeneration.
- `scripts/migrate.ts`, `scripts/backfill-pages.ts`.
- `__tests__/page-builder.test.ts`, `__tests__/landing-render.test.ts`.

### Files updated
- `proxy.ts`, `.env.example`, `README.md`: subdomain logic removed.
- `lib/models/Partner.ts`, `lib/validation/partner.ts`, `lib/theme-utils.ts`: single brand colour, page-config fields, testimonials.
- `components/landing/LandingPage.tsx`, `app/[slug]/page.tsx`: render from the saved config; per-partner title/meta/OG tags.
- `app/api/admin/partners/route.ts`: generates the page when a partner is created.
- `app/admin/partners/page.tsx`: one colour picker, testimonials editor, regenerate action.
- All emoji replaced with lucide icons (landing, admin, seed output, README); country selector shows ISO codes.
