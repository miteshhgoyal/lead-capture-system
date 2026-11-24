# Changelog: 24 Nov 2026

## 3x more landing page layouts, effect backgrounds, and a shared page "flow"

**Why**: shuffled pages were starting to look alike, and sections could feel stuck together. There are now 105 layouts (was 35), hero sections have animated backgrounds, and every page shares one backdrop and one card style so shuffled sections still read as one page.

### No migration needed
No database changes. Saved pages keep working: layout ids `*_1`..`*_4` are unchanged, and pages saved before this change have no `backdrop`/`surface` in `themeConfig`, which renders as the original (`blobs` / `solid`). Use "Regenerate" (or `pnpm backfill`) to give existing pages the new layouts.

### Layouts (variants per section)
navbar 3 -> 9, hero 4 -> 12, features 4 -> 12, steps / mentor / stats / testimonials / offer / faq / cta / footer 3 -> 9 each. New variants are in `components/landing/sections/<section>-more.tsx` and are registered in `registry.tsx`.

### Effects (`components/landing/fx/`)
Dependency-free, React Bits-style effects driven only by the page's brand colour tokens: Aurora, Beams, DotGrid (cursor reveal), Squares, RetroGrid, ChartLines (trading chart), Orb, Rings, Particles (canvas, pauses off-screen), Noise, Mesh; and StarBorder, SpotlightCard, TiltCard, ShinyText, ScrollProgress. All respect `prefers-reduced-motion`.

### Cohesion between shuffled sections
- `themeConfig.backdrop` (blobs, aurora, grid, dots, beams, mesh, noise): one fixed atmosphere under the whole page.
- `themeConfig.surface` (solid, glass, glow, outline): restyles every card on the page in one place (lead forms stay solid).
- Section dividers fade out at both ends (`.rt-seam`) and tinted bands fade in and out (`.rt-tint`) instead of hard edges. Effects fade into the next section. The original design (animation style "none") keeps its plain borders.

### Files
- Created: `components/landing/fx/*`, `components/landing/sections/{kit,navbar-more,hero-more,features-more,steps-more,mentor-more,stats-more,testimonials-more,offer-more,faq-more,cta-more,footer-more}.tsx`.
- Updated: `lib/page-builder/{types,theme,generate}.ts` (counts, backdrop/surface, drawn last so other choices for a seed are unchanged), `registry.tsx`, `LandingPage.tsx`, `ui.tsx`, `motion/Reveal.tsx` (`spot` prop), `app/globals.css`, `dev/LayoutsPreview.tsx` (backdrop + surface controls), tests.
