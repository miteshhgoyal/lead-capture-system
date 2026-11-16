# Competition module (phases, prizes, roadmap, display-only dummy layer, winners)

Added 13 Nov 2026. This is the technical reference; the admin how-to is in the main `README.md`.

## Where things live

| Area | Files |
| --- | --- |
| Phase engine (pure, server + client) | `lib/competition/phase.ts` |
| Timezone formatting / datetime-local helpers | `lib/competition/format.ts` |
| Validation (steps, prizes, schedule, media filenames) | `lib/competition/validation.ts` |
| Seed defaults + public types | `lib/competition/defaults.ts` |
| Settings / prizes / steps reads (10s in-process cache) | `lib/competition/settings-service.ts` |
| Merged public board (real + dummy) | `lib/competition/board-service.ts` |
| Dummy generator, PRNG, names, merge rules | `lib/competition/dummy/*` |
| Winner finalization | `lib/competition/winners-service.ts`, `lib/competition/cron.ts` |
| Folder media library | `lib/competition/media.ts`, `public/assets/steps/` |
| Models | `lib/models/{CompetitionSettings,Competition,Prize,HowToStep,Winner}.ts` |
| Public API | `app/api/competition/route.ts` (+ existing `/api/leaderboard`, `/api/stats`) |
| Admin API | `app/api/admin/competition/{settings,prizes,steps,steps/[id],steps/reorder,media,dummy-preview,winners}` |
| Admin UI | `app/admin/competition/page.tsx`, `components/admin/competition/*` |
| Public UI | `components/competition/*` wired into `components/LandingClient.tsx` |
| Migration / seed | `scripts/competition-migrate.ts` (`pnpm competition:migrate [--apply]`) |
| Tests | `__tests__/competition-{phase,dummy,content,winners}.test.ts` |

## Data model (MongoDB collections)

- `competition_settings` (single row `key: "main"`): title, subtitle, `startAt`/`endAt` (UTC), `displayTimezone` (default `Asia/Kolkata`), `endingSoonThresholdHours` (48), `useDummyData` (false), `dummyRefreshIntervalSeconds` (300), `dummySeedSalt`, `statusOverride` (`auto` | `force_ended`), `openAccountEnabled` (false), `openAccountLabel` ("Open account"), `openAccountUrl`, `openAccountNewTab` (true), `activeCompetitionId`, `updatedBy`, timestamps.
- `competitions`: one row per run (slug, title, start/end, `isActive`, `finalizedAt`). A new run is opened automatically when the admin schedules a new contest after a finalized one, so history stays attached to the old run.
- `prizes`: exactly ranks 1/2/3 (unique), title, amount (nullable), currency, description, badgeColor, icon, isVisible.
- `how_to_steps`: orderIndex, title (required), description (nullable), imageFilename (nullable, bare filename in `public/assets/steps`), isVisible.
- `winners`: unique `(competitionId, rank)`; displayName, maskedLogin, finalScore, totalTrades, winRate, bestTrade, symbolsTraded, equity, `prizeSnapshot`, `isDummy` (schema rejects `true`), finalizedAt.

The old `SiteSettings.contest` dates are only used to seed `competition_settings` the first time.

## Ranking period (competition window only)

Since round 2 (13 Nov 2026) the competition's own `startAt`..`endAt` is the ONLY ranking period. The separate
Settings date window was removed everywhere (UI, settings API, model, types, defaults) and its fields are `$unset` by
`pnpm competition:migrate --apply`. `computeProfitRanking()` (`lib/fogm/profit-ranking.ts`) counts trades with
`timeUtc >= startAt && timeUtc <= endAt` (exact UTC instants, inclusive, no day rounding):
- no `competition_settings` row or an invalid schedule: `configured: false`, empty board (never throws);
- before `startAt`: empty real board, real Active Traders / Total Trades = 0;
- during: trades closed inside the window;
- after `endAt`: trades after the end never count, so the board and winners are frozen.
Board, counters, ticker and winner finalization all read this same ranking.

## Phase engine

`getCompetitionPhase(now, startAt, endAt, thresholdHours, override)` returns one of
`UPCOMING_FAR`, `UPCOMING_SOON` (< 24h to start), `LIVE_JUST_STARTED` (first 72h, or first quarter of a short contest),
`LIVE`, `ENDING_SOON` (inside the threshold), `ENDED` (also when `statusOverride = force_ended`), plus countdown/progress
numbers that are never negative or NaN and `nextBoundaryAt` (when the phase can next change).

Hero layout: a phase badge, a "Competition schedule" block with two START / END tiles (large date, time + timezone,
calendar / flag icon), a thin progress bar while live, and large countdown digits labelled STARTS IN / STARTED N DAYS AGO /
ENDS IN / ENDING SOON (ended: "Ended N days ago"). Emphasis: upcoming highlights START; ending soon turns END amber with a
reduced-motion-safe pulse; ended mutes both. The admin Schedule preview renders the same block (compact).

Theme: `components/theme-mode.ts` reads the `dark` class through `useSyncExternalStore` (server snapshot = light), and
the no-flash boot script lives in `app/layout.tsx`, so theme toggles no longer cause hydration mismatches.

Clock: `/api/competition` returns `serverNow`. The client measures the offset once from the round trip and ticks every
second from `Date.now() + offset` with one shared ticker (`components/competition/use-competition.ts`). Nothing
time-dependent renders during SSR, so there is no hydration mismatch. The countdown's screen-reader text changes once a
minute (`aria-live="polite"`), not every second. The client re-fetches shortly after `nextBoundaryAt`, so phase changes
(and winners after the end) appear without a reload.

## Dummy layer (DISPLAY ONLY)

How determinism works: every dummy value is a pure function of `(dummy_seed_salt, competition_id, timeBucket)`, where
`timeBucket = floor(serverNowSeconds / dummy_refresh_interval_seconds)`. Seeds come from a stable string hash
(FNV-1a + murmur finaliser) fed into mulberry32, so any process on any server produces byte-identical output for the same
bucket. Trader identities (Indian first name + surname initial, masked 4-digit login, opaque `fogm_<hex>` id) depend only on
the salt and competition, so names never flicker; each trader has a seeded log-normal "skill", and their score follows a
smooth walk (slow + fast value noise with rare deterministic jumps) scaled to `max(real top score, 2400)` and to contest
progress, so ranks mostly move 1-3 places per bucket. The previous bucket is computed too, which gives the rank-change
arrows and the "climbed the board on XAUUSD" ticker events from the same diff the board uses. Rotating the salt
("Reshuffle universe") produces a new universe for everyone at the same moment.

Merge rules (`lib/competition/dummy/merge.ts`):
- Toggle off, or contest ended / force-ended => real data only; counters and ticker are real only.
- Toggle on => dummy rows show before the start (upcoming) and while live; they stop at the end.
- Toggle on (upcoming or live) => real + dummy sorted by score; rank 1 is always a dummy whose score is lifted to
  `max(real top, dummy top) x (1 + margin)`, margin 0.5-4% per bucket, so rank 1 is always strictly above rank 2.
- Public rows carry no dummy flag (same shape as real rows). Only `/api/admin/competition/dummy-preview` shows `isDummy`.
- The signed-in user's "you" row and the share-card rank use the same merged board, so card, board and lookup agree.
- Nothing is written: dummy rows never touch `fogm_raw_data`, `fogm_trades` or `winners`.

Caching: real data is re-ranked per request exactly as before; generated dummy rows are cached in-process per bucket
(pure, so caching never changes output). `/api/leaderboard` sets `s-maxage` to at most the time left in the bucket.
The client fetches with `cache: "no-store"` and refreshes right after the bucket boundary (+1.5-5s jitter, max 60s).

## Winners

`finalizeWinners()` ranks REAL traders only (`computeProfitRanking()`), takes the top 3, snapshots trades, win rate
(closing deals with positive net), best trade, symbols, equity and the prize, and inserts them in a transaction where the DB
supports it (falls back to a plain insert on standalone MongoDB; the unique index keeps it "once"). It runs from the
in-process cron (`instrumentation.ts`, every 60s, off with `FOGM_INTERNAL_CRON=off`), lazily from `/api/competition` after
the end, and from the admin "Finalize winners now" button. Every path is idempotent.

Public reads never create rows: until the seed script or an admin save runs, the site uses the built-in fallback schedule.

## Open Account button (optional)

Admin → Competition → Buttons: on/off, label (max 30, required when on), URL (http/https only; `javascript:` and other
schemes rejected; required when on), open-in-new-tab. `/api/competition` returns `openAccount: { label, url, newTab }`
only when enabled and valid (else `null`). `components/competition/OpenAccountButton.tsx` renders it (with
`rel="noopener noreferrer"` for new tabs) in the hero CTAs, the top nav (md and up), the roadmap CTA block and the mobile
sticky bar; disabled = rendered nowhere. Validation: `openAccountError` / `publicOpenAccount` in `validation.ts`.

## API

- `GET /api/competition`: `serverNow`, public settings, phase, visible prizes, visible steps (`title, description, imageUrl`), winners, `openAccount`. `no-store`.
- `GET /api/leaderboard`: unchanged shape plus `bucket: { id, intervalSeconds, nextAt } | null`.
- `GET /api/stats`: counters and ticker now include the dummy contribution while active.
- Admin (session cookie + same-origin check, audit-logged, caches invalidated on save):
  `GET/PUT/POST /api/admin/competition/settings` (POST `{action:"reshuffle"}`), `GET/PUT .../prizes`,
  `GET/POST .../steps`, `PUT/DELETE .../steps/[id]`, `PUT .../steps/reorder`, `GET .../media`,
  `GET .../dummy-preview`, `GET/POST .../winners`.
