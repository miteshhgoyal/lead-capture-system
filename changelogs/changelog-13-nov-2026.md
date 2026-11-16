# Changelog: 13 Nov 2026

## 19:05 IST: Competition system upgrade (phases, prizes, roadmap, dummy layer, winners)

**Why**: the Trading Pips board needed a real competition lifecycle (upcoming → live → ending soon → ended), admin-editable prizes and "how to participate" steps, a globally consistent display-only dummy-trader layer, and winners finalized once from real traders.

Migration: see `migrations/migration-13-nov-2026.md` (new collections + seed).
Technical reference: `docs/COMPETITION.md`. Admin how-to: README "Competition module".

### Files created
- `lib/competition/phase.ts`: pure phase engine shared by server and client.
- `lib/competition/format.ts`: timezone display ("1 Dec 2026, 09:00 AM IST") and datetime-local helpers.
- `lib/competition/validation.ts`: zod schemas for schedule/prizes/steps, safe media filenames.
- `lib/competition/defaults.ts`: fallback config, seed prizes/steps, public types.
- `lib/competition/settings-service.ts`: read-only cached reads + `ensureCompetitionSettings()`.
- `lib/competition/board-service.ts`: merged public board (real + dummy) with per-bucket snapshot cache.
- `lib/competition/dummy/prng.ts`, `dummy/generator.ts`, `dummy/merge.ts`, `dummy/indian-names.ts`: deterministic dummy layer (315 first names, 160 surnames).
- `lib/competition/winners-service.ts`, `lib/competition/cron.ts`: idempotent real-only winner finalization + scheduled check.
- `lib/competition/media.ts`, `lib/competition/steps-admin.ts`, `lib/competition/admin-route.ts`: media library, admin helpers.
- `lib/models/CompetitionSettings.ts`, `Competition.ts`, `Prize.ts`, `HowToStep.ts`, `Winner.ts`.
- `app/api/competition/route.ts` and `app/api/admin/competition/{settings,prizes,steps,steps/[id],steps/reorder,media,dummy-preview,winners}/route.ts`.
- `app/admin/competition/page.tsx`, `components/admin/competition/{admin-api,ScheduleTab,PrizesTab,DummyTab,StepsTab,MediaLibrary,WinnersTab}.tsx`.
- `components/competition/{use-competition.ts,PhaseStatus,PrizeStrip,Roadmap,WinnersPodium}.tsx`.
- `public/assets/steps/step-{account,verify,climb,win}.svg`: sample step images.
- `scripts/competition-migrate.ts` (+ `pnpm competition:migrate`).
- `__tests__/competition-{phase,dummy,content,winners}.test.ts`, `__tests__/helpers/dummy-snapshot.ts` (cross-process determinism helper).
- `docs/COMPETITION.md`, this changelog, `migrations/migration-13-nov-2026.md`.

### Files updated
- `components/LandingClient.tsx`: phase-aware hero (badge, start/end with timezone, countdown, progress, phase CTAs, winners focus when ended); new sections Prizes, roadmap in "How to enter", Winners; nav links Prizes/Winners; leaderboard rows keyed by trader with FLIP move animation, rank-change arrows and skeleton rows; refresh aligned to the board's bucket; transparency FAQ; mobile sticky CTA.
- `lib/fogm/leaderboard-service.ts`: leaderboard, "you" row, share-card rank, counters and ticker read the merged board.
- `lib/fogm/profit-ranking.ts`: `LeaderboardRow.previousRank/movement` widened to `number | null` / `number`.
- `lib/api.ts`: `bucket` on `LeaderboardPage`; client fetches use `cache: "no-store"`.
- `app/api/leaderboard/route.ts`: `s-maxage` capped at the time left in the current bucket.
- `lib/defaults.ts`: transparency FAQ copy keys.
- `components/admin/AdminShell.tsx`: "Competition" nav item.
- `instrumentation.ts`: starts the competition finalization check (independent of `DATA_SOURCE`; off with `FOGM_INTERNAL_CRON=off`).
- `package.json`: `competition:migrate` script.
- `README.md`: features list + "Competition module" section (setup, admin usage, adding step images, transparency).

### Decisions
- Kept MongoDB/Mongoose, Tailwind tokens, existing admin auth and primitives; no new libraries.
- Dummy layer is live-only: off before start and frozen after the end (public board shows real results).
- Public reads never write; rows are created by the seed script, admin saves or finalization.
- Real data is still re-ranked per request (an earlier 15s whole-board cache made real updates lag and broke existing sync tests, so it was replaced by a per-bucket cache of the dummy rows only).
- The leaderboard profit window (Settings) remains the source for which trades count; competition start/end drive phases.
- LIVE_JUST_STARTED = first 72h (or first quarter of a short contest).

### Verification
- `tsc --noEmit` clean; `tsx --test` 157/157 pass (against a throwaway local MongoDB on port 27027; DB suites skip without one); eslint: 0 errors in changed files (18 pre-existing errors remain in untouched admin pages).
- Browser-checked on a local dev server with seeded test data: upcoming, live, ending soon and ended heroes; prizes; roadmap fill + pins at 1280px and 360px (no horizontal scroll); toggle on/off reflected publicly; step create/reorder/delete and media library; lazy + manual winner finalization (idempotent).

### Cleanup
- Removed the temporary dev seed script and the throwaway app copy/test database used for browser checks (outside the repo).
- `pnpm install --frozen-lockfile` re-linked `node_modules` (its symlinks pointed at an old `D:\lead-capture-system` path); the `pnpm-workspace.yaml` edit pnpm made was reverted.

## 19:45 IST: Round 2 (ranking period, hydration fix, hero schedule tiles, Open Account button)

**Why**: the separate Settings ranking-date window duplicated the competition schedule; the theme toggle logged a hydration error on every page; the schedule needed to be a prominent hero element; operators asked for a configurable "Open account" button.

Migration: see `migrations/migration-13-nov-2026.md` → "Round 2".

### Files created
- `components/theme-mode.ts`: `useThemeMode()` (useSyncExternalStore, server snapshot = light) + the no-flash boot script.
- `components/competition/OpenAccountButton.tsx`, `components/admin/competition/ButtonsTab.tsx`.
- `__tests__/competition-open-account.test.ts`.

### Files updated
- Ranking period: `lib/fogm/profit-ranking.ts` (`competitionWindow()` replaces the old date parser; `computeProfitRanking()` reads the competition schedule; empty before start / without a settings row; capped at end), `lib/fogm/leaderboard-service.ts` (real counters 0 before start), `lib/models/SiteSettings.ts`, `lib/settings.ts`, `lib/defaults.ts`, `app/api/admin/settings/route.ts` (fields removed; stale clients' keys stripped), `app/admin/settings/page.tsx` (card removed, link to Competition → Schedule), `app/api/admin/stats/route.ts` + `app/admin/page.tsx` (dashboard tile shows the competition window), `components/LandingClient.tsx` (old window banner and copy removed), `scripts/competition-migrate.ts` (`$unset` step).
- Hydration: `app/layout.tsx` (boot script in `<head>`), `components/LandingClient.tsx`, `components/admin/AdminShell.tsx` (use `useThemeMode`), `app/admin/layout.tsx` (accent style passed as a style object instead of a `cssText` string).
- Hero: `components/competition/PhaseStatus.tsx` (START/END tiles, phase-aware emphasis, larger countdown with labels; also used by the admin Schedule preview), `lib/competition/format.ts` (`formatDateTimeParts`).
- Open Account: `lib/models/CompetitionSettings.ts`, `lib/competition/{defaults,settings-service,validation}.ts`, `app/api/admin/competition/settings/route.ts`, `app/api/competition/route.ts`, `components/competition/use-competition.ts`, `components/LandingClient.tsx` (hero, nav, roadmap CTA, sticky bar), `app/admin/competition/page.tsx` (Buttons tab).
- Dummy tab: note that dummy traders show only while live.
- Tests: `__tests__/profit.test.ts`, `__tests__/fogm-sync.test.ts` (seed a live competition), `__tests__/competition-winners.test.ts` (window boundaries, before-start, no-row cases), `__tests__/competition-content.test.ts` (grep check for old field names).
- Docs: `docs/COMPETITION.md`, `README.md`, `docs/SIMPLIFICATION_CHANGES.md` (superseded note).

### Decisions
- Per the request, only the typecheck was run this round (tests, lint, build and browser checks were not run). The 18 pre-existing lint errors in older admin pages were not touched.
- No hardcoded open-account/join link existed, so nothing was replaced.
- In the top nav the Open Account button shows from the `md` breakpoint; phones get it in the hero, the roadmap CTA and the sticky bar.
- LIVE_JUST_STARTED shows the elapsed counter ("Started N days ago"); later live phases show "Ends in".

### Cleanup
- Temporary edit scripts lived only in the session scratchpad (outside the repo) and were deleted.

## 19:55 IST: Dummy traders were not visible with the toggle on

**Why**: dummy rows were generated only in the LIVE phases, so with the toggle on the board showed no dummy traders whenever the contest was upcoming (and the admin preview said "inactive"). The operator expects them whenever the toggle is on.

### Files updated
- `lib/competition/board-service.ts`: dummy layer is active when the toggle is on and the contest has not ended (upcoming + live). It still stops at the end / force-ended, so the final board and winners stay real-only.
- `components/admin/competition/DummyTab.tsx`: help text and the inactive message updated.
- `README.md`, `docs/COMPETITION.md`: rule updated.

### Decisions
- Supersedes the earlier "live-only" decision above. The business rules are unchanged: rank 1 is always a dummy while active, dummy rows are never stored and never win.
- Verification: typecheck only (per request).
