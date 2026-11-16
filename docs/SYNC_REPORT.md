# Sync report (14 Nov 2026)

Short map of how leaderboard data gets from the broker to the page, written before the sync fixes.
"Before" describes the code as found; "Fix" is what changed in this run.

## Data source
- Accounts: `GET {FOGM_BASE_URL}/api/account.php` via `fetchFogmFeed` (`lib/fogm/fetcher.ts`), mapped by `mapAccountRow` (`lib/fogm/account-mapper.ts`) into `fogm_raw_data`.
- Deals: `GET /api/trades.php` via `fetchDealsByRange` / `fetchDealsForLogin` (`lib/fogm/trades-client.ts`), stored by `upsertDeals` (`lib/fogm/trade-store.ts`) into `fogm_trades`.
- Orchestration: `runUnifiedSync` (`lib/fogm/unified-sync.ts`), Mongo lock `FogmSyncLock` (10 min TTL), runs logged in `sync_runs` (`SyncRun`).

## Scheduler and interval
- `instrumentation.ts` -> `startInternalCron` -> `FogmScheduler` (`lib/fogm/scheduler.ts`), also `POST /api/internal/fogm-sync` (external cron) and `POST /api/admin/sync` (manual).
- Before: interval from `site_settings.syncIntervalMinutes`, default **10** (defaults, model, settings schema, `CRON_INTERVAL_MS`). `tick()` treated `failed`/`partial` results as success; no backoff.
- Fix: default **2** min (1..1440) everywhere; failed/partial/thrown runs count as consecutive failures, logged with `logger.error`, retried after `min(interval, 30s x 2^(failures-1))`, reset on success. Lock / login-backoff skips stay quiet and are not counted.

## How trades are counted / formulas
- Before: `computeProfitRanking` (`lib/fogm/profit-ranking.ts`) counted **every** trading deal (`isTrade`), including opening deals, and ranked by `$` unless `rankBy = percentage`; profit % used `balance - profit`.
- Fix: trades = closing deals only (entry OUT / INOUT / OUT_BY). Profit = sum of `net` (profit + swap + commission) of all trading deals in the window. Profit % = net profit / starting deposit x 100 (2 dp, null if deposit missing or <= 0). Starting deposit = frozen `startingDeposit` for the window, else live `equity - net profit`. Order: % desc (null last), $ desc, trades desc, earlier account, login.

## Incremental fetch
- Before: every run fetched `FOGM_TRADES_BACKFILL_FROM` (default 2020-01-01) -> tomorrow.
- Fix: from (start of the last completed run - 3 days, `TRADES_OVERLAP_DAYS`); full backfill only when no run ever completed.

## Caching layers
1. `trades-client.ts` in-memory page cache, 60s per URL. Before: the sync read through it. Fix: sync passes `{ fresh: true }`.
2. `/api/leaderboard`: `public, s-maxage<=30, stale-while-revalidate` (CDN could serve stale boards). Fix: `private, no-store, no-cache, max-age=0, must-revalidate` + `CDN-Cache-Control: no-store`, `connection()`.
3. `/api/stats`: `public, s-maxage=60, swr=120`, and the handler read no request data, so with `cacheComponents: true` it could be prerendered. Fix: no-store headers + `connection()`.
4. `lib/settings.ts` `"use cache"` + `cacheTag("settings")`. The sync called `revalidateTag("settings", "max-stale=0")` (not a cacheLife profile) and swallowed the error. Fix: `"max"` (as elsewhere) and the error is logged.
5. `lib/competition/settings-service.ts` 10s in-process cache of competition settings; `board-service.ts` in-flight dedupe + per-bucket dummy snapshot cache (display only). Unchanged.
6. Client `lib/api.ts` `http()` uses `cache: "no-store"`; `/api/stats` requests are deduped for 5s. Unchanged.
7. New: `/api/leaderboard/info` keeps a short public cache (30s) and a 30s server TTL that fails open.

## Frontend polling
- Before (`components/LandingClient.tsx` `useLandingData`): live mode refetched board + stats once per dummy bucket or 60s; the effect could stop rescheduling when a silent refetch returned the same data; no focus/visibility refetch; chart history never refreshed.
- Fix: 45s while visible (timer keeps running when hidden), on focus / visibility change (throttled 5s), board + stats + activity + history. Info line every 60s.

## Last-sync time
- Before: `updatedAt` = `completedAt` of the newest completed run sorted by `startedAt`, falling back to **now** (always looked fresh). Fixed 30-minute stale threshold in the UI; hardcoded green dots elsewhere.
- Fix: `lastSyncedAt` = `completedAt` of the newest completed run (by `completedAt`) or null; returned with `syncIntervalMinutes` by `/api/leaderboard`. `useBoardFreshness` drives every live dot (green < 2x interval, amber after, grey when never synced).

## Equity chart
- Before: `getFogmEquityHistory` read `fogm_raw_snapshots`, which only the legacy `lib/fogm/sync-service.ts` writes; `runUnifiedSync` never did, so the chart stayed on "Collecting data...".
- Fix: the sync stores one total-equity point per run in `fogm_equity_history` (UTC, newest 500) via `recordEquityPoint`; the chart reads it and needs 2 points.

## Error handling
- Users and trades steps are caught separately: users fail -> `failed`; trades fail -> `partial`. Errors go to `console.error` and `sync_runs.errorMessage`.
- Before: per-login fallback errors were swallowed (`.catch(() => null)`); `FogmHealth.consecutiveFailures` only counted `failed`. Fix: fallback errors are logged; `partial` counts as a failure too.
- Admin: `GET /api/admin/sync` returned keys the Sync page did not read (`isRunning` vs `running`, etc.). Fix: adds `running, lastSuccess, lastRun, nextScheduledAt, isStale, consecutiveFailures` (legacy keys kept) and a "Last Sync" card.
