# Change log: Trading Pips × FOGM integration

## Feed response handling (`GET {FOGM_BASE_URL}/api/account.php`)

**Why:** the account feed handling had drifted from the real response format. Missing or
garbage money fields were silently turned into `0` (faking equity), `ok:false`, `count` and
`scope` were mostly ignored, the "auth error" check scanned the whole body (a trader called
"Login" could fail a run) and echoed part of it into logs, eligibility rules were copy-pasted in
six places, and a few public payloads carried `balance`/`credit`.

### What changed

| Area | Change | Files |
| :--- | :--- | :--- |
| Single source of truth | New pure module with the endpoint path, page size, thresholds, reason/warning codes, envelope + row validation, feed assessment, derived-field rules, eligibility helper and `FOGM_API_DOCS`. | `lib/fogm/fogmApi.ts` (new) |
| Validation | Per-row validation; numeric strings accepted, NaN/Infinity rejected, **missing money field = invalid row**, 2 dp rounding, email lower+trim+shape check, name whitespace collapse, extra keys → `rawPayload` only. >10% or all invalid → run failed with no writes. | `fogmApi.ts`, `fetcher.ts`, `sync-service.ts` |
| Envelope | `ok:false` / missing `data` = failed fetch; auth wording → `FogmAuthError`, otherwise retryable. `count` vs `data.length` → `countMismatch` / `truncatedSuspected`. Empty feed → completed + warning, no sweep. Duplicates → last wins. `scope` recorded as `feedScope`, change → warning. Bodies never logged. | `fetcher.ts`, `fogmApi.ts` |
| Mapping | `rankingScore = max(0, equity - credit)` (fixed; `FOGM_RANKING_METRIC` now ignored), `isFunded`, `isTest` on first sight only (word match on name or `demo` env, no longer email), `isTestSource` (admin flags never overwritten), canonical key-sorted `rowHash`, snapshots for every seen row, `previousActiveCount` taken before writes, ranks cleared when an account stops being eligible. | `account-mapper.ts` (new), `sync-service.ts`, `models/FogmRawData.ts` |
| Group parsing | First backslash only; `<env>\<server>-<asset>-<tier>[-H]-<referrer>`; unknown shapes → `"unknown"` (forward slash no longer accepted). | `group-parser.ts` |
| Telemetry | Run stores `responseCount`, `rowsValid`, `rowsInvalid`, `invalidReasons`, `duplicatesInResponse`, `countMismatch`, `feedScope`, `warnings[]`. Admin health card shows them. | `models/FogmSyncRun.ts`, `api/admin/fogm/status`, `api/admin/fogm/sync`, `app/admin/page.tsx` |
| Public display | Shared `maskName` (unicode-safe), `maskLogin`, `publicDisplayName` (consent). `balance`/`credit` removed from public rows. Search matches the displayed name only. Test/hidden/unfunded accounts get no public card; `fogm_<login>` lookups removed. Share-card `total` = eligible count; trend from real snapshots only. | `display.ts` (new), `leaderboard-service.ts`, `lib/rank.ts`, `api/card/[userId]/route.tsx` |
| Admin | Accounts table/drawer: raw + masked name, parsed group (hedging marked unconfirmed), credit/margin block (margin level only when margin > 0), funded/test-source/eligibility badges, UTC first/last seen. CSV export streams the same columns and neutralises formula injection. | `app/admin/leaderboard/page.tsx`, `api/admin/fogm/accounts/*`, `lib/fogm/account-csv.ts` (new) |
| Docs | Upstream feed card on `/admin/api-docs` rendered from `FOGM_API_DOCS`; runbook §7. Real-looking emails in the runbook QA script replaced with `@example.com`. | `app/admin/api-docs/page.tsx`, `docs/FOGM_RUNBOOK.md` |
| Indexes | `publicId` unique (partial, so legacy empty values don't collide). | `models/FogmRawData.ts` |
| Tests | New pure validation suite; fetcher/parser/sync suites updated to fake data and the new rules. DB suite skips unless an isolated `*_test` DB is reachable. | `__tests__/*` |

### Unverified with FOGM
- Whether the feed ever sends numbers as strings (both handled).
- Whether `count` is the page size or the grand total when paginating (both accepted).
- Whether the `-H-` group token means Hedging.

### Deploy notes
Run `pnpm fogm:indexes`. The first sync after deploy rewrites every account once (new hash
format). Accounts auto-flagged as test by the old email-based rule keep the flag until an admin
reviews them.

## Live-mode fixes: login, content 404s, sample fallback, Trading Pips branding

**Login.** The live path still read the old env vars (`FOGM_API_URL`, `FOGM_LOGIN_*`) and preferred a stored bootstrap cookie (`FOGM_COOKIE_VALUE`) over logging in, so an expired cookie kept failing; repeated failed re-logins then left the session in backoff / hard stop, and the admin card reported every auth failure as "cookie expired". Now: `FOGM_BASE_URL` + `/login.php` + `/api/account.php` (constants in `fogmApi.ts`), JSON body keys in `LOGIN_BODY_KEYS`, any Set-Cookie name accepted, verify before storing, precise states and reason codes in admin, Re-login clears backoff/hard stop, credential change auto-resets, `pnpm fogm:smoke` for diagnosis.

**404 sections.** `getContent()` / `getPastEditions()` called `/content` and `/past-editions`, which never existed. All content now comes from `SiteSettings` (empty values fall back to defaults); only `/api/leaderboard` and `/api/stats` are fetched.

**Mock = live.** Mock data is 50 rows in the exact feed shape run through the same validation, derivation, eligibility, ranking and entry builder (`lib/fogm/board.ts`). In live mode, blocks show real data or clean neutral empty states (no sample badges or fallback mock substitution). Mock mode (`DATA_SOURCE=mock`) presents mock data directly without badges.

**Branding.** User-visible "FOGM" → Trading Pips (metadata, emails, admin chrome, share text, card wordmark, logo "T"). Stored settings are guarded at read time and can be rewritten with `pnpm rebrand:settings --apply`. Technical names (`lib/fogm`, `Fogm*`, env vars, cookies, Cloudinary folders) unchanged.

---

## Cleanup pass (Investigation & Remediation)

### Key Fixes
1. **Multi-Cookie Resolution (Root Cause)**: ReportWise upstream sends multiple `Set-Cookie: PHPSESSID` headers upon login (the first unauthenticated, the second regenerated). Updated `extractSetCookies` and `extractRotatedCookie` to de-duplicate headers using browser semantics (last occurrence wins).
2. **Backoff Ladder**: Replaced exponential backoff with ladder: 1m / 5m / 15m / 1h, with hard stop at 5 failures (`LOGIN_HARD_STOP_AFTER = 5`).
3. **Lock Synchronization**: Re-login now acquires the unified `fogm_sync_lock` via `tryAcquireSyncLock` before attempting credential re-authentication, returning HTTP 409 if a sync run is active.
4. **Health & Partial Runs**: Allowed `"partial"` run status in `FogmHealth` and admin UI (amber badge). `leaderboard-service.ts` queries strictly `status: "completed"` runs for cache freshness.
5. **Env & Config Consolidation**: Dropped 9 unused optional env vars (`FOGM_ALERT_EMAIL`, `FOGM_STALE_AFTER_MINUTES`, `FOGM_PAGINATION_MODE`, `FOGM_PAGE_SIZE`, `FOGM_PAGE_PARAM`, `FOGM_OFFSET_PARAM`, `FOGM_LIMIT_PARAM`, `FOGM_GROUP_LIKE*`). Constants are codified in `lib/fogm/fogmApi.ts`. Alerts go strictly to `ADMIN_EMAIL`.
6. **User Broker Account Gating**: `app/api/auth/verify-otp` validates that the email exists in `FogmRawData` when `DATA_SOURCE=fogm` before account creation, with fail-safe bypass if the collection is empty or feed health has >= 5 consecutive failures.
7. **Admin Pruning**: Removed unused CMS pages (`contest`, `prizes`, `content`, `design`), removed unused `dataSource` selector from `SiteSettings`, and relocated `brand.name`, `brand.tagline`, and `contest.prizeFund` directly to `/admin/settings`.
8. **Removed Fabricated Data**: Removed "Past Editions" and "Instrument Breakdown" mock data, types, and API handlers.
9. **Dead Code Purge**: Deleted `Trader.ts` manual CRUD model and endpoints, unused scripts, and legacy documentation.

### Files Modified
- `lib/fogm/auth.ts`
- `lib/fogm/fetcher.ts`
- `lib/fogm/fogmApi.ts`
- `lib/fogm/env.ts`
- `lib/fogm/sync-service.ts`
- `lib/fogm/leaderboard-service.ts`
- `lib/api.ts`
- `lib/defaults.ts`
- `lib/settings.ts`
- `lib/api-registry.ts`
- `lib/models/SiteSettings.ts`
- `lib/models/FogmHealth.ts`
- `app/api/auth/verify-otp/route.ts`
- `app/api/admin/fogm/relogin/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/stats/route.ts`
- `app/admin/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/api-docs/page.tsx`
- `components/admin/AdminShell.tsx`
- `components/LandingClient.tsx`
- `scripts/fogm-smoke.ts`
- `.env.example`
- `docs/FOGM_RUNBOOK.md`
- `README.md`
- `docs/CHANGES_TRADING_PIPS_FOGM.md`

### Files Deleted
- `lib/env.ts`
- `lib/models/Trader.ts`
- `app/admin/contest/page.tsx`
- `app/admin/prizes/page.tsx`
- `app/admin/content/page.tsx`
- `app/admin/design/page.tsx`
- `components/admin/ColorField.tsx`
- `components/admin/ImageUpload.tsx`
- `app/api/admin/upload/sign/route.ts`
- `app/api/admin/traders/route.ts`
- `app/api/admin/traders/import/route.ts`
- `scripts/migrate-privacy.ts`
- `.env.backup-before-cleanup`
- `FOGM_LEADERBOARD_INVESTIGATION.md`
- `FOGM_LIVE_DATA_IMPLEMENTATION_REPORT.md`
- `docs/AUDIT.md`
