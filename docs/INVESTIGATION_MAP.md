# Comprehensive Investigation Map & Architecture Audit

> **Target Output:** `docs/INVESTIGATION_MAP.md`  
> **Repository:** `lead-capture-system`  
> **Status:** Strictly READ-ONLY Investigation (Zero Code Changes, Zero DB Mutations)  
> **All Claims Citing:** Exact `file:line` references.

---

## 1. Repo Map

### 1.1 Depth-3 Directory & File Tree

| File / Folder | Purpose | Primary Importers / Callers | Lines | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `package.json` | Project scripts and dependency declarations | npm / pnpm package runner | 37 | **ACTIVE** |
| `pnpm-lock.yaml` | Lockfile for pnpm dependencies | pnpm package manager | 3688 | **ACTIVE** |
| `pnpm-workspace.yaml` | Workspace configuration | pnpm package manager | 4 | **ACTIVE** |
| `tsconfig.json` | TypeScript compiler configuration | `tsc`, Next.js build | 34 | **ACTIVE** |
| `next.config.ts` | Next.js configuration (inlines `NEXT_PUBLIC_DATA_SOURCE`, Turbopack, image host) | Next.js engine | 28 | **ACTIVE** |
| `proxy.ts` | Edge middleware protecting `/admin/:path*` (redirects unauthenticated to `/admin/login`) | Next.js runtime | 22 | **ACTIVE** |
| `vercel.json` | Vercel Cron declaration for `/api/internal/fogm-sync` (`*/10 * * * *`) | Vercel deployment infrastructure | 8 | **ACTIVE** |
| `eslint.config.mjs` | ESLint configuration | `pnpm lint` | 16 | **ACTIVE** |
| `README.md` | Top-level project setup and overview | Developer documentation | 92 | **ACTIVE** |
| `.env` | Local environment variables | Next.js, tsx runtime | 30 | **ACTIVE** |
| `.env.example` | Template environment variables | Onboarding reference | 35 | **ACTIVE** |
| `.env.backup-before-cleanup` | Stale backup of pre-cleanup environment variables | None | 52 | **DEAD** |
| `AGENTS.md` | Agentic workflow rules and Next.js feedback hook | Antigravity agent system | 17 | **ACTIVE** |
| `FOGM_LEADERBOARD_INVESTIGATION.md` | Legacy pre-rewrite audit report (55 KB) | None | 676 | **DEAD** |
| `FOGM_LIVE_DATA_IMPLEMENTATION_REPORT.md`| Historical report on live feed rewrite | None | 215 | **DEAD** |
| `app/layout.tsx` | Root Next.js layout, font setup, theme script, metadata | Next.js App Router | 38 | **ACTIVE** |
| `app/page.tsx` | Public landing page server component (loads settings, renders `LandingClient`) | Next.js router (`/`) | 6 | **ACTIVE** |
| `app/globals.css` | Global Tailwind CSS v4 styling rules | `app/layout.tsx:4` | 505 | **ACTIVE** |
| `app/robots.ts` | Dynamic `robots.txt` generator | Next.js search crawlers | 14 | **ACTIVE** |
| `app/favicon.ico` | Application favicon icon | Browser | 18 | **ACTIVE** |
| `app/u/[userId]/page.tsx` | Public user profile & share card preview page | Direct URL route `/u/[userId]` | 65 | **ACTIVE** |
| `app/admin/layout.tsx` | Admin area shell wrapper, loads branding and settings | `/admin/*` routes | 68 | **ACTIVE** |
| `app/admin/page.tsx` | Admin overview dashboard (metrics, charts, sync health, trigger buttons) | Nav `/admin` | 814 | **ACTIVE** |
| `app/admin/login/page.tsx` | Admin email/password login page | Route `/admin/login` | 103 | **ACTIVE** |
| `app/admin/leaderboard/page.tsx` | Admin feed accounts table, filters, CSV export, sync action | Nav `/admin/leaderboard` | 693 | **ACTIVE** |
| `app/admin/users/page.tsx` | User management CRM table, drawer, status toggle, bulk actions | Nav `/admin/users` | 653 | **ACTIVE** |
| `app/admin/api-docs/page.tsx` | Interactive API documentation and upstream feed specification viewer | Nav `/admin/api-docs` | 507 | **ACTIVE** |
| `app/admin/audit/page.tsx` | Admin audit log viewer with CSV export | Nav `/admin/audit` | 307 | **ACTIVE** |
| `app/admin/settings/page.tsx` | System settings editor (maintenance and revalidation) | Nav `/admin/settings` | 352 | **ACTIVE** |
| `app/admin/contest/page.tsx` | Contest dates, prize fund, currency, stage rules editor | Nav `/admin/contest` | 373 | **CMS / EXTRA** |
| `app/admin/prizes/page.tsx` | Prize tier configuration editor | Nav `/admin/prizes` | 336 | **CMS / EXTRA** |
| `app/admin/content/page.tsx` | Rules, FAQs, Steps, Disclosures content editor | Nav `/admin/content` | 479 | **CMS / EXTRA** |
| `app/admin/design/page.tsx` | Accent colors, dark/light themes, logos, favicon editor | Nav `/admin/design` | 342 | **CMS / EXTRA** |
| `app/api/leaderboard/route.ts` | Public leaderboard endpoint (paginated, sorted, masked) | `lib/api.ts:768` | 43 | **ACTIVE** |
| `app/api/stats/route.ts` | Public aggregates, activity ticker, equity history endpoint | `lib/api.ts:723, 821` | 32 | **ACTIVE** |
| `app/api/me/route.ts` | User session self-inspection and profile update (GET / PATCH) | `components/AuthProvider.tsx:13`, `JoinModal.tsx:510` | 70 | **ACTIVE** |
| `app/api/card/[userId]/route.tsx` | OG image dynamically rendered rank card (PNG via Satori) | `components/ShareCard.tsx:74, 127` | 84 | **ACTIVE** |
| `app/api/auth/request-otp/route.ts` | Requests OTP.com generation and stores provider metadata | `components/JoinModal.tsx:163` | 33 | **ACTIVE** |
| `app/api/auth/resend-otp/route.ts` | Resends an OTP through OTP.com after cooldown | `components/JoinModal.tsx:276` | 35 | **ACTIVE** |
| `app/api/auth/verify-otp/route.ts` | Verifies OTP code, upserts User, issues session cookie | `components/JoinModal.tsx:224` | 69 | **ACTIVE** |
| `app/api/auth/logout/route.ts` | Clears user session cookie | `components/AuthProvider.tsx:102` | 7 | **ACTIVE** |
| `app/api/avatar/sign/route.ts` | Issues Cloudinary upload signature for user avatar | `components/JoinModal.tsx:394` | 13 | **ACTIVE** |
| `app/api/internal/fogm-sync/route.ts` | Cron webhook for live feed sync (Bearer secret authenticated) | Vercel Cron (`vercel.json`), external curl | 76 | **ACTIVE** |
| `app/api/admin/login/route.ts` | Admin authentication endpoint, issues `fogm_admin` cookie | `app/admin/login/page.tsx:20` | 98 | **ACTIVE** |
| `app/api/admin/logout/route.ts` | Clears `fogm_admin` cookie | `components/admin/AdminShell.tsx:159` | 7 | **ACTIVE** |
| `app/api/admin/stats/route.ts` | Admin dashboard CRM statistics & chart aggregates | `app/admin/page.tsx:145` | 81 | **ACTIVE** |
| `app/api/admin/settings/route.ts` | Read & write `SiteSettings` | `app/admin/settings/page.tsx:43`, etc. | 55 | **ACTIVE** |
| `app/api/admin/settings/revalidate/route.ts`| Next.js on-demand cache revalidator for settings | `app/admin/settings/page.tsx:138` | 20 | **ACTIVE** |
| `app/api/admin/upload/sign/route.ts` | Issues Cloudinary signature for admin uploads | `components/admin/ImageUpload.tsx:38` | 21 | **ACTIVE** |
| `app/api/admin/fogm/status/route.ts` | Ingestion status, health card telemetry, and auth state | `app/admin/page.tsx:155` | 96 | **ACTIVE** |
| `app/api/admin/fogm/sync/route.ts` | Admin manual sync trigger ("Sync Now") | `app/admin/page.tsx:192`, `leaderboard/page.tsx:131`| 67 | **ACTIVE** |
| `app/api/admin/fogm/relogin/route.ts` | Admin manual re-login trigger ("Re-login Now") | `app/admin/page.tsx:172` | 54 | **ACTIVE** |
| `app/api/admin/fogm/accounts/route.ts` | Paginated admin feed accounts query & flag editing | `app/admin/leaderboard/page.tsx:116, 150` | 172 | **ACTIVE** |
| `app/api/admin/fogm/accounts/export/route.ts`| Streaming CSV export of raw feed accounts | `app/admin/leaderboard/page.tsx:225` | 76 | **ACTIVE** |
| `app/api/admin/users/route.ts` | Admin user list, filter by FOGM link, edit & delete user | `app/admin/users/page.tsx:129, 147` | 200 | **ACTIVE** |
| `app/api/admin/users/bulk/route.ts` | Bulk activate / disable / delete users | `app/admin/users/page.tsx:220` | 49 | **ACTIVE** |
| `app/api/admin/users/export/route.ts` | CSV export of user CRM records | `app/admin/users/page.tsx:361` | 60 | **ACTIVE** |
| `app/api/admin/audit/route.ts` | Paginated admin audit logs query | `app/admin/audit/page.tsx:66` | 40 | **ACTIVE** |
| `app/api/admin/audit/export/route.ts` | CSV export of audit logs | `app/admin/audit/page.tsx:81` | 55 | **ACTIVE** |
| `app/api/admin/traders/route.ts` | Old manual CRUD leaderboard API (GET, POST, PATCH, DELETE) | **NONE (Not called by any UI component)** | 124 | **DEAD** |
| `app/api/admin/traders/import/route.ts`| Old CSV import for manual Trader model | **NONE (Not called by any UI component)** | 94 | **DEAD** |
| `components/LandingClient.tsx` | Monolithic public landing page client (leaderboard, ticker, modals) | `app/page.tsx:6` | 2220 | **ACTIVE** |
| `components/AuthProvider.tsx` | Client context provider for user session via `/api/me` | `app/layout.tsx:28` | 104 | **ACTIVE** |
| `components/auth-context.ts` | React context definition for user auth state | `components/AuthProvider.tsx`, `LandingClient.tsx`| 24 | **ACTIVE** |
| `components/JoinModal.tsx` | 4-step modal: OTP request, OTP verify, profile setup, share card | `components/LandingClient.tsx:2371` | 680 | **ACTIVE** |
| `components/Avatar.tsx` | Avatar rendering with fallback initials and Cloudinary support | `LandingClient.tsx`, `JoinModal.tsx`, etc. | 38 | **ACTIVE** |
| `components/RankCta.tsx` | Floating / sticky rank CTA on landing page | `components/LandingClient.tsx:2367` | 55 | **ACTIVE** |
| `components/ShareCard.tsx` | Client preview and copy modal for user rank card | `components/JoinModal.tsx:492` | 145 | **ACTIVE** |
| `components/admin/AdminShell.tsx` | Navigation sidebar, header, dark mode toggle, logout handler | `app/admin/layout.tsx:61` | 305 | **ACTIVE** |
| `components/admin/AdminPrimitives.tsx`| UI building blocks (Card, Button, Badge, Input, Select, Modal) | All `app/admin/*` pages | 578 | **ACTIVE** |
| `components/admin/DataTable.tsx` | Generic sortable, paginated data table component | Admin leaderboard, users, audit pages | 309 | **ACTIVE** |
| `components/admin/Drawer.tsx` | Sliding side-panel drawer for detail editing | Admin leaderboard and users pages | 63 | **ACTIVE** |
| `components/admin/ConfirmDialog.tsx`| Modal confirmation dialog for destructive actions | Admin users, leaderboard, settings pages | 112 | **ACTIVE** |
| `components/admin/FormField.tsx` | Label + input wrapper for forms | Admin settings, contest, prizes, content pages | 53 | **ACTIVE** |
| `components/admin/ImageUpload.tsx` | Direct-to-Cloudinary image uploader with preview | Admin design, prizes, settings pages | 160 | **ACTIVE** |
| `components/admin/ColorField.tsx` | Color picker input field | Admin design page (`app/admin/design/page.tsx:16`)| 87 | **ACTIVE** |
| `components/admin/Toast.tsx` | Toast notification provider and hook | Admin layout (`app/admin/layout.tsx:15`) | 73 | **ACTIVE** |
| `lib/api.ts` | Client data layer (MOCK_DB, HTTP client, sample fallbacks) | `components/LandingClient.tsx:21-27` | 826 | **ACTIVE** |
| `lib/api-registry.ts` | Static catalog of endpoints for `/admin/api-docs` | `app/admin/api-docs/page.tsx:14` | 683 | **OVERLAPPING** |
| `lib/db.ts` | Mongoose connection singleton with caching | All models, API routes, sync services | 22 | **ACTIVE** |
| `lib/admin-auth.ts` | Admin session JWT issuance, verification, cookie management | All `/api/admin/*` routes | 60 | **ACTIVE** |
| `lib/session.ts` | User session JWT issuance (`fogm_session_user`), cookie helpers | `app/api/auth/*`, `app/api/me/*`, `lib/rank.ts` | 77 | **ACTIVE** |
| `lib/rank.ts` | Rank entry resolution for user sessions and share cards | `app/api/me/route.ts:7`, `app/u/[userId]/page.tsx:5` | 46 | **ACTIVE** |
| `lib/http.ts` | Standard HTTP response helpers (`json`, `fail`, `sameOrigin`) | All API route handlers | 44 | **ACTIVE** |
| `lib/mail.ts` | Nodemailer client for OTP emails and admin failure alerts | `app/api/auth/request-otp`, `sync-service.ts` | 64 | **ACTIVE** |
| `lib/rate-limit.ts` | MongoDB-backed sliding window rate limiter | Auth routes, sync routes, admin relogin | 42 | **ACTIVE** |
| `lib/audit.ts` | Audit logging helper (`logAudit`) | All `/api/admin/*` mutation handlers | 55 | **ACTIVE** |
| `lib/settings.ts` | Settings fetcher with Next.js cache revalidation tag | `app/page.tsx:1`, `app/admin/*`, `lib/fogm/leaderboard-service.ts` | 131 | **ACTIVE** |
| `lib/defaults.ts` | Hardcoded default content, prizes, contest parameters, theme | `lib/settings.ts:8`, `leaderboard-service.ts:8` | 165 | **ACTIVE** |
| `lib/brand.ts` | Dynamic brand name display filter ("FOGM" -> "Trading Pips") | `components/LandingClient.tsx:29` | 50 | **ACTIVE** |
| `lib/cloudinary.ts` | Cloudinary signature generation and URL validation | `app/api/avatar/sign`, `app/api/admin/upload/sign` | 80 | **ACTIVE** |
| `lib/card-theme.ts` | Rank card theme definition (colors, layout metrics) | `lib/card-view.tsx:9` | 15 | **ACTIVE** |
| `lib/card-view.tsx` | JSX template for Satori PNG rank card rendering | `app/api/card/[userId]/route.tsx:10` | 237 | **ACTIVE** |
| `lib/avatar-url.ts` | Avatar URL normalization helper | `lib/card-view.tsx:11` | 16 | **ACTIVE** |
| `lib/use-async.ts` | Generic React async data-fetching hook (`useFetch`) | Admin pages | 49 | **ACTIVE** |
| `lib/env.ts` | Legacy env validation | None (superseded by `lib/fogm/env.ts`) | 23 | **DEAD** |
| `lib/fogm/fogmApi.ts` | Single source of truth: feed URLs, schemas, validation, docs | `fetcher.ts`, `sync-service.ts`, `auth.ts`, `api-docs/page.tsx` | 556 | **ACTIVE** |
| `lib/fogm/env.ts` | Zod schema & validation for FOGM environment configuration | `auth.ts`, `fetcher.ts`, `sync-service.ts`, `scripts/*`| 130 | **ACTIVE** |
| `lib/fogm/auth.ts` | Automated login, cookie classification, backoff, reauth lock | `sync-service.ts`, `api/admin/fogm/relogin`, `api/admin/fogm/status` | 478 | **ACTIVE** |
| `lib/fogm/fetcher.ts` | HTTP feed page fetcher, retry logic, envelope classification | `lib/fogm/sync-service.ts:12` | 261 | **ACTIVE** |
| `lib/fogm/sync-service.ts` | Main sync engine: fetch, hash, upsert, snapshot, sweep, ranks | `api/admin/fogm/sync`, `api/internal/fogm-sync` | 523 | **ACTIVE** |
| `lib/fogm/account-mapper.ts`| Normalizes raw account row, derives scores, computes SHA-256 hash | `lib/fogm/sync-service.ts:14` | 71 | **ACTIVE** |
| `lib/fogm/account-csv.ts` | Streaming CSV generation for feed accounts | `app/api/admin/fogm/accounts/export/route.ts:5` | 37 | **ACTIVE** |
| `lib/fogm/leaderboard-service.ts`| Live leaderboard queries, aggregations, trends, public mapping | `app/api/leaderboard`, `app/api/stats`, `lib/rank.ts`| 346 | **ACTIVE** |
| `lib/fogm/board.ts` | Builds public leaderboard entry from raw account and user link | `lib/fogm/leaderboard-service.ts:11` | 101 | **ACTIVE** |
| `lib/fogm/display.ts` | Privacy masking for names ("Sagar S.") and logins ("••1410") | `leaderboard-service.ts:10`, `account-csv.ts:4` | 54 | **ACTIVE** |
| `lib/fogm/public-id.ts` | HMAC-SHA256 generation of opaque publicId (`fogm_<12 hex>`) | `leaderboard-service.ts:9`, `account-mapper.ts` | 8 | **ACTIVE** |
| `lib/fogm/crypto.ts` | AES-256-GCM encryption/decryption for session cookie storage | `lib/fogm/auth.ts:6` | 67 | **ACTIVE** |
| `lib/fogm/group-parser.ts` | Parses MetaTrader broker group strings | `lib/fogm/account-mapper.ts:8` | 50 | **ACTIVE** |
| `lib/models/User.ts` | Mongoose model for registered platform users | `app/api/auth/*`, `app/api/me/*`, `admin/users` | 33 | **ACTIVE** |
| `lib/models/OtpCode.ts` | Mongoose model for email OTP codes (10m TTL) | `app/api/auth/request-otp`, `app/api/auth/verify-otp` | 19 | **ACTIVE** |
| `lib/models/RateLimit.ts` | Mongoose model for sliding-window rate limit counters | `lib/rate-limit.ts:6` | 14 | **ACTIVE** |
| `lib/models/AuditLog.ts` | Mongoose model for admin action logs (180d TTL) | `lib/audit.ts:4`, `app/api/admin/audit/*` | 24 | **ACTIVE** |
| `lib/models/SiteSettings.ts` | Mongoose model for application configuration & CMS content | `lib/settings.ts:4`, `app/api/admin/settings/*` | 93 | **ACTIVE** |
| `lib/models/Trader.ts` | Mongoose model for legacy manual CRUD leaderboard | `app/api/admin/traders/route.ts:6` | 40 | **DEAD** |
| `lib/models/FogmRawData.ts` | Mongoose model storing all live MetaTrader accounts from feed | `sync-service.ts`, `leaderboard-service.ts`, admin | 99 | **ACTIVE** |
| `lib/models/FogmRawSnapshot.ts`| Mongoose model storing historical snapshots (90d TTL) | `sync-service.ts`, `leaderboard-service.ts` | 31 | **ACTIVE** |
| `lib/models/FogmSyncRun.ts` | Mongoose model storing sync execution history and telemetry | `sync-service.ts`, `api/admin/fogm/status` | 77 | **ACTIVE** |
| `lib/models/FogmSyncLock.ts` | Mongoose model for distributed sync lock and re-auth lock | `sync-service.ts`, `lib/fogm/auth.ts` | 21 | **ACTIVE** |
| `lib/models/FogmSession.ts` | Mongoose model storing encrypted session cookie and backoff | `lib/fogm/auth.ts:3`, `api/admin/fogm/status` | 48 | **ACTIVE** |
| `lib/models/FogmHealth.ts` | Mongoose model storing overall sync health, failure counters | `sync-service.ts`, `api/admin/fogm/status` | 29 | **ACTIVE** |
| `scripts/fogm-smoke.ts` | Live feed diagnostic CLI tool (no DB writes) | `package.json:12` (`pnpm fogm:smoke`) | 76 | **ACTIVE** |
| `scripts/init-fogm-indexes.ts` | Creates MongoDB indexes for FOGM collections | `package.json:11` (`pnpm fogm:indexes`) | 36 | **ACTIVE** |
| `scripts/rebrand-settings.ts`| Migrates "FOGM" strings to "Trading Pips" in SiteSettings | `package.json:13` (`pnpm rebrand:settings`) | 54 | **ACTIVE** |
| `scripts/migrate-privacy.ts` | One-off migration script for user privacy flags | None | 81 | **DEAD** |
| `docs/AUDIT.md` | Legacy application audit document | Reference only | 555 | **DEAD** |
| `docs/FOGM_RUNBOOK.md` | Production operations runbook for FOGM live integration | Operational documentation | 193 | **ACTIVE** |
| `docs/CHANGES_TRADING_PIPS_FOGM.md`| Detailed changelog of live data overhaul | Reference documentation | 34 | **ACTIVE** |
| `__tests__/fogm-feed-validation.test.ts`| Unit tests for pure validation in `fogmApi.ts` | `pnpm test` | 323 | **ACTIVE** |
| `__tests__/fogm-fetcher.test.ts` | Mocked unit tests for feed fetcher and pagination | `pnpm test` | 210 | **ACTIVE** |
| `__tests__/fogm-parser.test.ts` | Unit tests for MetaTrader group string parsing | `pnpm test` | 63 | **ACTIVE** |
| `__tests__/fogm-reauth.test.ts` | Crypto & auth unit tests (AES-256 round-trip, backoff ladder) | `pnpm test` | 60 | **ACTIVE** |
| `__tests__/fogm-sync.test.ts` | End-to-end sync integration test (requires `*_test` MongoDB) | `pnpm test` | 402 | **ACTIVE** |
| `__tests__/live-fixes.test.ts` | Regression tests for live bugfixes | `pnpm test` | 164 | **ACTIVE** |
| `__tests__/fixtures/fogm-feed.ts`| Test fixtures mimicking upstream ReportWise API | Test suites | 70 | **ACTIVE** |
| `__tests__/helpers/test-db.ts` | Test DB connection helper; strictly prevents touching non-`*_test` DB | `__tests__/fogm-sync.test.ts` | 58 | **ACTIVE** |
| `assets/fonts/Inter-Regular.otf` | Font binary bundled for Satori rank card PNG generation | `next.config.ts:28`, `lib/card-view.tsx` | 2684 | **ACTIVE** |
| `assets/fonts/Inter-SemiBold.otf`| Font binary bundled for Satori rank card PNG generation | `next.config.ts:28`, `lib/card-view.tsx` | 3231 | **ACTIVE** |

---

### 1.2 Route Inventory: Pages & API Routes

#### A. Pages (`app/**/page.tsx`)

| Route Path | Auth Requirement | Reads | Writes | UI Caller / Navigation |
| :--- | :--- | :--- | :--- | :--- |
| `/` (`app/page.tsx:4`) | Public | `SiteSettings` via `getSettings()` | None | Direct user navigation |
| `/u/[userId]` (`app/u/[userId]/page.tsx:10`) | Public | `User`, `FogmRawData` via `resolveEntry()` | None | Share links, `/u/[userId]` |
| `/admin` (`app/admin/page.tsx:125`) | Admin Cookie (`proxy.ts:10`) | `/api/admin/stats`, `/api/admin/fogm/status` | Calls `/api/admin/fogm/sync`, `/relogin` | Sidebar: "Overview" (`AdminShell.tsx:21`) |
| `/admin/login` (`app/admin/login/page.tsx:12`) | Public (Admin unauthenticated) | None | Posts to `/api/admin/login` | Redirected by `proxy.ts:13` |
| `/admin/leaderboard` (`app/admin/leaderboard/page.tsx:82`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/fogm/accounts` | Toggles flags via `/api/admin/fogm/accounts`, triggers sync | Sidebar: "Leaderboard Data" (`AdminShell.tsx:34`) |
| `/admin/users` (`app/admin/users/page.tsx:686`) | Admin Cookie (`proxy.ts:10`) | `/api/admin/users` | Edits/deletes users via `/api/admin/users`, bulk actions | Sidebar: "Users" (`AdminShell.tsx:24`) |
| `/admin/api-docs` (`app/admin/api-docs/page.tsx:165`)| Admin Cookie (`proxy.ts:10`) | `API_REGISTRY`, `FOGM_API_DOCS` | Executes live test GET requests to endpoints | Sidebar: "API Docs" (`AdminShell.tsx:117`) |
| `/admin/audit` (`app/admin/audit/page.tsx:43`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/audit` | None | Sidebar: "Audit Log" (`AdminShell.tsx:104`) |
| `/admin/settings` (`app/admin/settings/page.tsx:34`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/settings` | Updates settings via PATCH, revalidates cache | Sidebar: "Settings" (`AdminShell.tsx:94`) |
| `/admin/contest` (`app/admin/contest/page.tsx:46`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/settings` | Updates contest settings via PATCH | Sidebar: "Contest" (`AdminShell.tsx:48`) |
| `/admin/prizes` (`app/admin/prizes/page.tsx:35`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/settings` | Updates prize settings via PATCH | Sidebar: "Prizes" (`AdminShell.tsx:60`) |
| `/admin/content` (`app/admin/content/page.tsx:41`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/settings` | Updates content settings via PATCH | Sidebar: "Content & Copy" (`AdminShell.tsx:70`) |
| `/admin/design` (`app/admin/design/page.tsx:45`)| Admin Cookie (`proxy.ts:10`) | `/api/admin/settings` | Updates brand/theme settings via PATCH | Sidebar: "Design & Brand" (`AdminShell.tsx:81`) |

#### B. API Routes (`app/api/**/route.ts` & `.tsx`)

| Route | Method | Auth | Reads | Writes | UI Caller |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/leaderboard` (`app/api/leaderboard/route.ts:5`) | GET | Public | `FogmRawData`, `User`, `FogmSyncRun` | None | `lib/api.ts:768` (`getLeaderboard`) |
| `/api/stats` (`app/api/stats/route.ts:4`) | GET | Public | `FogmRawData`, `FogmRawSnapshot`, `SiteSettings` | None | `lib/api.ts:723, 821` (`getContestStats`, `liveStats`) |
| `/api/me` (`app/api/me/route.ts:12, 50`) | GET, PATCH | User JWT Session (`getSession`) | `User`, `FogmRawData` | `User` (name, avatarUrl, privacy flags) | `components/AuthProvider.tsx:13`, `JoinModal.tsx:510`, `LandingClient.tsx:941` |
| `/api/card/[userId]` (`app/api/card/[userId]/route.tsx:28`)| GET | Public | `User`, `FogmRawData`, `Inter` fonts | None (Generates PNG) | `components/ShareCard.tsx:74, 127`, `app/u/[userId]/page.tsx:18` |
| `/api/auth/request-otp` (`app/api/auth/request-otp/route.ts:13`)| POST | Public + Rate Limit | `OtpCode`, OTP.com | `OtpCode` (stores provider id and expiry), OTP.com sends code | `components/JoinModal.tsx:163` |
| `/api/auth/resend-otp` (`app/api/auth/resend-otp/route.ts:8`)| POST | Public + Cooldown | `OtpCode`, OTP.com | Updates provider OTP metadata | `components/JoinModal.tsx:276` |
| `/api/auth/verify-otp` (`app/api/auth/verify-otp/route.ts:14`)| POST | Public + Rate Limit | `OtpCode`, `User` | Deletes `OtpCode`, upserts `User`, sets JWT cookie | `components/JoinModal.tsx:224` |
| `/api/auth/logout` (`app/api/auth/logout/route.ts:3`) | POST | Public | User Cookie | Clears `fogm_session_user` cookie | `components/AuthProvider.tsx:102` |
| `/api/avatar/sign` (`app/api/avatar/sign/route.ts:4`) | POST | User JWT Session | `process.env.CLOUDINARY_*` | None (Returns cryptographic signature) | `components/JoinModal.tsx:394` |
| `/api/internal/fogm-sync` (`app/api/internal/fogm-sync/route.ts:80, 84`)| GET, POST| Bearer Secret (`CRON_SECRET`) | Feed, DB | Executes `runFogmSync("cron")`, writes `FogmRawData`, `FogmSyncRun`, etc. | `vercel.json:4`, external cron worker |
| `/api/admin/login` (`app/api/admin/login/route.ts:18`) | POST | Public + Rate Limit | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Sets `fogm_admin` cookie, logs `AuditLog` | `app/admin/login/page.tsx:20` |
| `/api/admin/logout` (`app/api/admin/logout/route.ts:3`) | POST | Public | Admin Cookie | Clears `fogm_admin` cookie | `components/admin/AdminShell.tsx:159` |
| `/api/admin/stats` (`app/api/admin/stats/route.ts:14`) | GET | Admin Cookie | `User`, `FogmRawData`, `AuditLog` | None | `app/admin/page.tsx:145`, `settings/page.tsx:101` |
| `/api/admin/settings` (`app/api/admin/settings/route.ts:11, 23`)| GET, PATCH| Admin Cookie | `SiteSettings` | Updates `SiteSettings`, logs `AuditLog` | `app/admin/settings/page.tsx:43, 81`, etc. |
| `/api/admin/settings/revalidate` (`app/api/admin/settings/revalidate/route.ts:6`)| POST | Admin Cookie | None | Calls `revalidateTag("settings")` | `app/admin/settings/page.tsx:138` |
| `/api/admin/upload/sign` (`app/api/admin/upload/sign/route.ts:6`)| POST | Admin Cookie | Cloudinary Env | None (Returns signature) | `components/admin/ImageUpload.tsx:38` |
| `/api/admin/fogm/status` (`app/api/admin/fogm/status/route.ts:11`)| GET | Admin Cookie | `FogmSyncRun`, `FogmHealth`, `FogmRawData`, `User`, `FogmSession` | None | `app/admin/page.tsx:155` |
| `/api/admin/fogm/sync` (`app/api/admin/fogm/sync/route.ts:8`) | POST | Admin Cookie + Rate Limit | DB Locks, FOGM Feed | Executes `runFogmSync("manual")`, logs `AuditLog` | `app/admin/page.tsx:192`, `leaderboard/page.tsx:131` |
| `/api/admin/fogm/relogin` (`app/api/admin/fogm/relogin/route.ts:12`)| POST | Admin Cookie + Rate Limit | FOGM Credentials | Executes `loginAndStore(true)`, logs `AuditLog` | `app/admin/page.tsx:172` |
| `/api/admin/fogm/accounts` (`app/api/admin/fogm/accounts/route.ts:14, 114`)| GET, PATCH| Admin Cookie | `FogmRawData` | Updates flags (`isTest`, `adminHidden`, `adminNote`), recomputes ranks | `app/admin/leaderboard/page.tsx:116, 150` |
| `/api/admin/fogm/accounts/export` (`app/api/admin/fogm/accounts/export/route.ts:10`)| GET | Admin Cookie | `FogmRawData` | None (Streams CSV response) | `app/admin/leaderboard/page.tsx:225` |
| `/api/admin/users` (`app/api/admin/users/route.ts:15, 126, 172`)| GET, PATCH, DELETE| Admin Cookie | `User`, `FogmRawData` | Updates user status, profile, or deletes user | `app/admin/users/page.tsx:129, 147, 172, 204` |
| `/api/admin/users/bulk` (`app/api/admin/users/bulk/route.ts:11`)| POST | Admin Cookie | `User` | Bulk updates user status or deletes users | `app/admin/users/page.tsx:220` |
| `/api/admin/users/export` (`app/api/admin/users/export/route.ts:9`)| GET | Admin Cookie | `User`, `FogmRawData` | None (Streams CSV response) | `app/admin/users/page.tsx:361` |
| `/api/admin/audit` (`app/api/admin/audit/route.ts:11`) | GET | Admin Cookie | `AuditLog` | None | `app/admin/audit/page.tsx:66` |
| `/api/admin/audit/export` (`app/api/admin/audit/export/route.ts:11`)| GET | Admin Cookie | `AuditLog` | None (Streams CSV response) | `app/admin/audit/page.tsx:81` |
| `/api/admin/traders` (`app/api/admin/traders/route.ts:8, 59, 80, 107`)| GET, POST, PATCH, DELETE| Admin Cookie | `Trader` | Creates, updates, deletes `Trader` docs | **NONE (Uncalled route! No UI calls this)** |
| `/api/admin/traders/import` (`app/api/admin/traders/import/route.ts:12`)| POST | Admin Cookie | CSV file | Bulk inserts into `Trader` collection | **NONE (Uncalled route! No UI calls this)** |

#### Flags:
- **Routes nothing calls:**
  - `app/api/admin/traders/route.ts` (`GET`, `POST`, `PATCH`, `DELETE`): Remains from legacy manual CRUD system; zero callers in UI.
  - `app/api/admin/traders/import/route.ts` (`POST`): Old CSV importer for `Trader` collection; zero callers in UI.
- **UI calls to routes that do not exist:**
  - Previously, `getContent()` and `getPastEditions()` called `/content` and `/past-editions`. These were removed and resolved in `lib/api.ts:700, 855` via `SiteSettings` and `MOCK_DB`. Currently, **zero missing routes** are called by the UI.

---

## 2. Data Flow: Three Modes

### Mode A: Mock Mode (`DATA_SOURCE=mock`)

When `DATA_SOURCE=mock` (or unset), the application bypasses all MongoDB feed tables and live API ingestion.

```
+-----------------------------------------------------------------------------------+
|                        MOCK MODE (DATA_SOURCE=mock)                               |
+-----------------------------------------------------------------------------------+

 1. Generation:
    `lib/api.ts:291-569` defines `MOCK_DB` containing:
    - `leaderboard`: 50 fake trader accounts in exact GET /api/account.php shape:
      { login: 6000001..6000050, name: "Lucas Moreau", email: "lucas.moreau@example.com",
        equity: 42150.8, balance: 35000, credit: 0, floating: 7150.8, margin: 4200, ... }
    - `contestStats`: { prizeFund: 50000, tradersEnrolled: 1420, activeTraders: 890, ... }
    - `activity`: 8 simulated trade profit / rank climb events
    - `equityHistory`: 14-day aggregate equity timeline
    - `instrumentBreakdown`: EURUSD, XAUUSD, GBPUSD, BTCUSD distribution
    - `pastEditions`: 3 historical championship results

 2. Public API Route Consumption:
    - `GET /api/leaderboard` (`app/api/leaderboard/route.ts:15-32`):
      Bypasses DB -> Reads `MOCK_DB.leaderboard[period]` -> Filters by search -> Returns slice.
    - `GET /api/stats` (`app/api/stats/route.ts:7-17`):
      Bypasses DB -> Returns `MOCK_DB.contestStats`, `MOCK_DB.activity`, `MOCK_DB.equityHistory`.

 3. Client UI Rendering:
    - `LandingClient.tsx` displays full 50-trader leaderboard with rank 27 pinned as "You"
      when signed in with a mock profile (`lib/api.ts:742`).
    - No "Sample data" warning badges appear because the mode itself is explicitly mock.
```

---

### Mode B: Live Mode (`DATA_SOURCE=fogm`)

Full automated pipeline from upstream ReportWise MetaTrader feed to database models and client UI:

```
+-----------------------------------------------------------------------------------+
|                         LIVE MODE (DATA_SOURCE=fogm)                              |
+-----------------------------------------------------------------------------------+

 [Upstream ReportWise Engine]
      |
      | 1. HTTP Ingestion Trigger: Cron (`app/api/internal/fogm-sync/route.ts:80`)
      |    or Admin Sync Now (`app/api/admin/fogm/sync/route.ts:28`)
      v
 [runFogmSync()] (`lib/fogm/sync-service.ts:291`)
      |
      |-- 2. Lock: `acquireLock(runId)` on `fogm_sync_lock` (TTL 300s) (`lib/fogm/sync-service.ts:298`)
      |-- 3. Stale Reaper: `reapStaleRuns()` marks runs > 10m as failed (`lib/fogm/sync-service.ts:296`)
      |-- 4. Session Retrieval: `getSessionCookie()` (`lib/fogm/auth.ts:397`)
      |      Reads `FogmSession` doc -> decrypts AES-256-GCM cookie (`lib/fogm/crypto.ts:38`)
      |      If missing/corrupted -> invokes `loginAndStore()` (`lib/fogm/auth.ts:325`)
      v
 [fetchFogmFeed()] (`lib/fogm/fetcher.ts:192`)
      |
      |-- 5. HTTP GET `{FOGM_BASE_URL}/api/account.php` with `Cookie: PHPSESSID=...` (`lib/fogm/fetcher.ts:93`)
      |-- 6. Envelope Validation: `classifyAccountEnvelope()` requires `{ ok: true, data: [...] }` (`lib/fogm/fogmApi.ts:186`)
      |-- 7. Pagination Loop: Handles `page`, `offset`, or `none` up to `FOGM_MAX_PAGES` (50) (`lib/fogm/fetcher.ts:216`)
      |-- 8. Row Validation: `validateAccountRows()` validates all 7 money fields, login, email (`lib/fogm/fogmApi.ts:265`)
      |      Threshold Check: If > 10% invalid -> aborts run, writes ZERO rows (`lib/fogm/sync-service.ts:365`)
      v
 [Mapping & DB Ingestion] (`lib/fogm/sync-service.ts:395-473`)
      |
      |-- 9. Baseline & Hash Check: `computeRowHash()` (SHA-256) compares against existing (`lib/fogm/account-mapper.ts:10`)
      |-- 10. Bulk Upsert: `FogmRawData.bulkWrite()` in batches of 500 (`lib/fogm/sync-service.ts:464`)
      |       - Mapped via `mapAccountRow()` (`lib/fogm/account-mapper.ts:24`)
      |       - `rankingScore = max(0, equity - credit)`
      |       - `isFunded = balance !== 0 || equity !== 0`
      |       - `publicId = fogm_<hmac_sha256>`
      |-- 11. Unchanged rows touch: `lastSeenAt` & `lastRunId` refreshed (`lib/fogm/sync-service.ts:455`)
      |-- 12. Snapshots: `FogmRawSnapshot.insertMany()` records time-series for every row (`lib/fogm/sync-service.ts:470`)
      v
 [Deactivation Sweep & Ranks] (`lib/fogm/sync-service.ts:474-498`)
      |
      |-- 13. Guarded Sweep: If feed complete and seen >= 50% of active baseline:
      |       `FogmRawData.updateMany({ login: { $nin: seenLogins } }, { isActive: false })`
      |-- 14. Rank Recomputation: `recomputeRanks()` calculates `currentRank` over `eligibleFilter()`:
      |       `isActive && !isTest && !adminHidden && rankingScore > 0` (`lib/fogm/sync-service.ts:242`)
      v
 [Telemetry & Cache Invalidation] (`lib/fogm/sync-service.ts:505-531`)
      |
      |-- 15. Record Run: `FogmSyncRun.findOneAndUpdate()` records telemetry (`lib/fogm/sync-service.ts:505`)
      |-- 16. Record Health: `recordHealthStatus()` updates `FogmHealth` (`lib/fogm/sync-service.ts:524`)
      |-- 17. Cache Bust: `revalidateTag("leaderboard")` and `revalidatePath("/")` (`lib/fogm/sync-service.ts:527`)
      v
 [Public Read Services]
      |
      |-- 18. `getFogmLeaderboard()` (`lib/fogm/leaderboard-service.ts:148`):
      |       Joins `FogmRawData` with `User` collection via lowercase email (`lib/fogm/leaderboard-service.ts:60`)
      |       Masks names (`maskName` -> "Sagar S.") and logins (`maskLogin` -> "••1410")
      |       Builds 14-day trend from `FogmRawSnapshot` (`lib/fogm/leaderboard-service.ts:84`)
      |-- 19. `/api/leaderboard` returns JSON payload to client (`app/api/leaderboard/route.ts:46`)
      v
 [LandingClient.tsx UI]
      - Renders live leaderboard table, top 3 podium, live green status dot ("Live · updated Xm ago")
```

---

### Mode C: Fallback Logic in Live Mode

Every location where mock, sample, or default data is substituted when running in Live Mode (`DATA_SOURCE=fogm`):

| Component / Section | Trigger Condition | Substituted Data | Labeled "Sample data"? | Can Mix With Real Rows? | Exact Code Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Leaderboard Table** | `ranked.length === 0` (0 eligible accounts in DB) | `MOCK_DB.leaderboard.overall` mapped with IDs `sample_1..N` | **YES** (`page.sample = true`, `<SampleBadge />` shown) | **NO** (Entire page is replaced; no real rows present) | `lib/fogm/leaderboard-service.ts:171-187`, `LandingClient.tsx:1257, 1676` |
| **User Rank Card / Sticky Bar** | User not in FOGM feed or not eligible (`entry === null`) | `you: null`, rank card unrendered or disabled | **N/A** (User simply sees no rank card) | **NO** | `lib/fogm/leaderboard-service.ts:205-223`, `LandingClient.tsx:2367` |
| **Contest Stats (Hero)** | Database query fails or `/api/stats` throws HTTP error | `markSample({ ...MOCK_DB.contestStats })` | **YES** (`isSample(stats)` triggers `<SampleBadge />`) | **NO** (Replaces the entire stats block) | `lib/api.ts:726-728`, `LandingClient.tsx:1222, 1492` |
| **Activity Ticker** | No accounts with $\ge 3$ rank climb (`climbers.length === 0`) | `markSample(mockActivity())` | **YES** (`isSample(activity)` triggers `<SampleBadge />`) | **NO** (Entire activity feed is sample) | `lib/api.ts:834`, `LandingClient.tsx:1378` |
| **Equity History Chart** | Fewer than 3 calendar days of snapshots recorded | `markSample(structuredClone(MOCK_DB.equityHistory))` | **YES** (`isSample(history)` triggers `<SampleBadge />`) | **NO** (Entire SVG chart is sample) | `lib/api.ts:843`, `LandingClient.tsx:1420` |
| **Instrument Breakdown** | Always in live mode (FOGM feed does not provide symbols) | `markSample(structuredClone(MOCK_DB.instrumentBreakdown))` | **YES** (Marked via `markSample`) | **NO** | `lib/api.ts:850`, `app/api/stats/route.ts:32` |
| **Winners Section** | In live mode, derived from top 20 of current leaderboard | If leaderboard is sample or fails, `winnersFrom(mockPage, true)` | **YES** (`winners.sample = true`, triggers `<SampleBadge />`) | **NO** | `lib/api.ts:799-801`, `LandingClient.tsx:1881` |
| **Past Editions** | Always (no past editions stored in FOGM) | `markSample(structuredClone(MOCK_DB.pastEditions))` | **YES** (Marked via `markSample`) | **NO** | `lib/api.ts:855` |
| **Rules / Steps / FAQ** | CMS content in `SiteSettings` is empty or DB unseeded | Hardcoded fallback arrays in `lib/api.ts:700` (`MOCK_DB.content`) | **NO** (Rendered as normal marketing copy) | **NO** | `lib/api.ts:700-708` |
| **Prizes Section** | `SiteSettings.prizes` is empty array | `MOCK_DB.prizeTiers` | **NO** (Standard prize structure) | **NO** | `lib/api.ts:710-713` |

#### Data Source Configuration Disagreement Analysis:
- `process.env.DATA_SOURCE`: Read on server in `lib/fogm/env.ts:52`, `app/api/leaderboard/route.ts:12`, `app/api/stats/route.ts:5`, `app/api/card/[userId]/route.tsx:53`, `lib/rank.ts:15`, and `next.config.ts:7`. Values: `"mock"` or `"fogm"`.
- `process.env.NEXT_PUBLIC_DATA_SOURCE`: Inlined at build time by Next.js via `next.config.ts:7` (`process.env.DATA_SOURCE || "mock"`). Read in browser by `lib/api.ts:15` (`USE_MOCK = !(DATA_SOURCE === 'fogm' || NEXT_PUBLIC_DATA_SOURCE === 'fogm')`) and `app/admin/settings/page.tsx:217`.
- `SiteSettings.dataSource`: Stored in MongoDB schema `lib/models/SiteSettings.ts:38, 87` with enum `["mock", "database", "external"]`. Default is `"mock"`.
- **Can they disagree?** **YES, COMPLETELY.**
  1. `SiteSettings.dataSource` is **completely disconnected** from the ingestion engine. No server route or leaderboard logic checks `SiteSettings.dataSource`. An administrator changing `dataSource` in the admin settings UI has **zero effect** on whether the app runs in live or mock mode.
  2. If `DATA_SOURCE=fogm` is changed in `.env` without a Next.js rebuild/restart, the client-side bundle may retain `NEXT_PUBLIC_DATA_SOURCE="mock"`, causing `lib/api.ts:USE_MOCK` in the browser to evaluate to `true` while the server routes `/api/leaderboard` evaluate to live FOGM mode!

---

## 3. How Sync Is Triggered: Manual vs Cron Exact Paths

| Trigger | Originating File | Auth Check | Target Function Called | Lock Behavior | Writes to `FogmSyncRun` / `FogmHealth` | What Admin UI Shows |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin "Sync Now"** | `app/admin/page.tsx:188` (`handleSyncNow`) | `sameOrigin` + `requireAdmin()` (`app/api/admin/fogm/sync/route.ts:9, 13`) + Rate limit (10/hr) | `runFogmSync("manual")` (`lib/fogm/sync-service.ts:291`) | Acquires `fogm_sync_lock` (TTL 300s). Returns 409 if locked. | Creates `FogmSyncRun` (trigger="manual"). On success/failure updates `FogmHealth`. | Success toast with counts or error toast with `errorCode` (`page.tsx:196-200`). |
| **Admin "Re-login Now"** | `app/admin/page.tsx:168` (`handleRelogin`) | `sameOrigin` + `requireAdmin()` (`app/api/admin/fogm/relogin/route.ts:13, 17`) + Rate limit (10/hr) | `loginAndStore(true)` (`lib/fogm/auth.ts:325`) | Acquires `fogm_reauth_lock` (TTL 60s). Clears backoff/hard stop. **Does NOT acquire `fogm_sync_lock`!** | Does NOT create `FogmSyncRun`. Does NOT update `FogmHealth`. Updates `FogmSession`. | Toast: "Logged in to the live feed; session verified" or "Re-login failed" (`page.tsx:175-178`). |
| **Internal Route (`/api/internal/fogm-sync`) GET & POST** | `app/api/internal/fogm-sync/route.ts:80, 84` | `verifySecret(req)` timing-safe comparison of `Bearer <CRON_SECRET>` (min 32 chars) (`route.ts:16-29`) | `runFogmSync("cron")` (`lib/fogm/sync-service.ts:291`) | Acquires `fogm_sync_lock` (TTL 300s). Returns 409 if locked. | Creates `FogmSyncRun` (trigger="cron"). Updates `FogmHealth.lastCronRunAt` and status. | Dashboard health card updates on next reload. If inactive > 25m, red critical banner appears (`page.tsx:380-394`). |
| **Vercel Cron** | `vercel.json:1-8` | Handled automatically by Vercel injecting `Authorization: Bearer <CRON_SECRET>` | Dispatches GET to `/api/internal/fogm-sync` every 10 min | Same as internal route above | Same as internal route above | Keeps `FogmHealth.lastCronRunAt` fresh ($<25$m). |
| **GitHub Workflows** | None | None | None | None | None | None |
| **In-process Timer** | None | None | None | None | None | None |
| **Client-side Calls** | None (Browser client never triggers sync directly; only calls read endpoints) | N/A | N/A | N/A | N/A | N/A |

### Deployment Target & Cron Viability Evidence:
1. **Evidence of Vercel Deployment:**
   - Root configuration file `vercel.json` exists declaring crons (`vercel.json:1-8`).
   - Serverless bundle file tracing declared in `next.config.ts:28` (`outputFileTracingIncludes`).
   - Route duration configuration `export const maxDuration = 60` in `app/api/internal/fogm-sync/route.ts:5`.
   - Vercel geolocation headers inspected in `app/api/auth/verify-otp/route.ts:50` (`x-vercel-ip-country`).
2. **Can cron run there?**
   - **On Vercel Pro/Enterprise:** YES, Vercel Cron fires `GET /api/internal/fogm-sync` automatically every 10 minutes according to `vercel.json`.
   - **On Vercel Hobby:** Vercel Hobby allows at most 1 cron execution per day; a `*/10 * * * *` cron will fail to deploy or be throttled unless upgraded or triggered by an external scheduler (e.g. cron-job.org or Linux crontab).
   - **In Local Dev:** Vercel Cron does **NOT** run locally. Cron must be triggered via manual curl or admin button. In our live DB inspection, `FogmHealth.lastCronRunAt` was stale/null, confirming no automated cron is currently hitting the local dev server.

---

## 4. WHY SYNC FAILS (The Main Question)

### 4.1 Line-by-Line Execution Trace: Button Click to Failure Toast

```
1. Admin clicks "Sync Now" button in `app/admin/page.tsx:365-375`.
2. `handleSyncNow` executes in `app/admin/page.tsx:188-208`.
3. Sends `POST /api/admin/fogm/sync`.
4. `app/api/admin/fogm/sync/route.ts:8-28`:
   - Validates `sameOrigin(req)` (line 9) -> PASS.
   - Validates `requireAdmin()` (line 13) -> PASS.
   - Checks rate limit `hit("admin:fogm:sync:...")` (line 20) -> PASS.
   - Calls `runFogmSync("manual")` (line 28).
5. `lib/fogm/sync-service.ts:291-320` (`runFogmSync`):
   - `reapStaleRuns()` (line 296) -> cleans up any orphaned running runs.
   - `acquireLock(runId)` (line 298) -> atomically acquires `fogm_sync_lock` -> returns `true`.
   - `FogmSyncRun.create({ status: "running", trigger: "manual" })` (line 309).
   - `assertFogmEnv()` (line 318) -> validates all 6 required vars -> PASS.
   - Calls `getSessionCookie()` (line 319).
6. `lib/fogm/auth.ts:397-421` (`getSessionCookie`):
   - `syncCredentialState(config)` (line 401) reads `FogmSession.findById("fogm_session")`.
   - Computes `credentialsHash(config)`: `42ea6acaf...` matches stored hash -> PASS.
   - Checks `session?.encryptedValue` (line 404).
   - CRITICAL BRANCH POINT: In the live database, `session.encryptedValue` is EMPTY (`""`).
   - Line 420 executes: Fallback to `loginAndStore()`.
7. `lib/fogm/auth.ts:325-365` (`loginAndStore(false)`):
   - Checks backoff: `session.consecutiveLoginFailures` is checked.
   - Acquires `fogm_reauth_lock` (line 341) -> PASS.
   - Calls `postLogin(config)` (line 355).
8. `lib/fogm/auth.ts:191-210` (`postLogin`):
   - Sends `POST {FOGM_BASE_URL}/login.php` with `{"username": ..., "password": ...}`.
   - Response received: `HTTP 200 OK`.
   - Response headers contain TWO `Set-Cookie` headers:
     `Set-Cookie: PHPSESSID=aaa; path=/` (initial empty session)
     `Set-Cookie: PHPSESSID=bbb; path=/` (authenticated session)
   - `classifyLoginResponse(200, headers, body)` executes (line 154).
   - Line 186 executes: `const cookie = pickSessionCookie(cookies)`.
   - BUG SITE: `pickSessionCookie` in `lib/fogm/auth.ts:128` uses `cookies.find(...)` which returns
     the FIRST element in the array (`cookies[0]`), selecting the UNAUTHENTICATED cookie (`aaa`).
   - Returns `{ ok: true, cookie: { name: "PHPSESSID", value: "aaa" } }`.
9. `lib/fogm/auth.ts:362` (`loginAndStore`):
   - Calls `verifySessionCookie(config, "PHPSESSID", "aaa")`.
10. `lib/fogm/auth.ts:213-228` (`verifySessionCookie`):
    - Sends `GET {FOGM_BASE_URL}/api/account.php` with `Cookie: PHPSESSID=aaa`.
    - ReportWise rejects the unauthenticated cookie: returns `HTTP 401 Unauthorized`
      `{"ok":false,"error":"Unauthorized"}`.
    - Line 222: `if (res.status < 200 || res.status >= 300) return false;` triggers!
    - Returns `false`.
11. `lib/fogm/auth.ts:363-365`:
    - `recordLoginFailure("verify_failed", credHash)` is called (line 363).
      - Increments `consecutiveLoginFailures` in `FogmSession`.
      - Computes exponential backoff and updates `loginBackoffUntil`.
      - Sets `lastLoginError = "verify_failed"`, `lastLoginReason = "verify_failed"`.
    - Throws `new FogmLoginError("verify_failed")` (line 364).
12. `lib/fogm/sync-service.ts:547-576`:
    - Catches error. `authErrorCode(err)` returns `"LOGIN_FAILED:verify_failed"`.
    - Updates `FogmSyncRun`: `status: "auth_failed"`, `errorCode: "LOGIN_FAILED:verify_failed"`,
      `errorMessage: "FOGM login failed: verify_failed"`.
    - Updates `FogmHealth`: `lastRunStatus = "auth_failed"`, increments `consecutiveFailures`.
    - Releases `fogm_sync_lock`.
    - Returns `{ success: false, status: "auth_failed", errorCode: "LOGIN_FAILED:verify_failed" }`.
13. `app/api/admin/fogm/sync/route.ts:49-69`:
    - Responds with HTTP 200 JSON `{ ok: false, status: "auth_failed", errorCode: "LOGIN_FAILED:verify_failed" }`.
14. `app/admin/page.tsx:196-197`:
    - Checks `data.status === "auth_failed"`.
    - Executes `showToast("Sync failed: LOGIN_FAILED:verify_failed", "error")`.
    - Toast renders on screen.
```

---

### 4.2 Throw Sites in `fetchFogmFeed` & Their Error Classes

In `lib/fogm/fetcher.ts`:

| Line | Condition | Error Class Thrown | Stored `errorCode` |
| :--- | :--- | :--- | :--- |
| `fetcher.ts:106` | Network timeout or DNS failure on page fetch | `FogmFetchError("Fetch failed on page X: ...")` | `FETCH_FAILED` |
| `fetcher.ts:110` | Server returns HTTP 3xx redirect (login page) | `FogmAuthError("Received HTTP 3xx redirect ...")` | `AUTH_FAILED` |
| `fetcher.ts:113` | Server returns HTTP 401 or 403 | `FogmAuthError("Received HTTP 401/403 Unauthorized")` | `AUTH_FAILED` |
| `fetcher.ts:116` | Server returns HTTP 5xx | `FogmFetchError("HTTP 5xx server error from FOGM")` | `FETCH_FAILED` |
| `fetcher.ts:119` | Server returns HTTP 4xx (other than 401/403) | `FogmFetchError("HTTP 4xx from FOGM")` | `FETCH_FAILED` |
| `fetcher.ts:128` | Content-type is HTML or body starts with `<html` | `FogmAuthError("Received HTML document instead of JSON ...")` | `AUTH_FAILED` |
| `fetcher.ts:131` | Response body is empty | `FogmAuthError("Received empty response body from FOGM feed")` | `AUTH_FAILED` |
| `fetcher.ts:140` | JSON parse fails & text contains auth keywords | `FogmAuthError("FOGM returned a non-JSON auth error")` | `AUTH_FAILED` |
| `fetcher.ts:142` | JSON parse fails on arbitrary text | `FogmFetchError("FOGM returned invalid JSON")` | `FETCH_FAILED` |
| `fetcher.ts:147` | JSON envelope has auth error (`FOGM_AUTH_ERROR_PATTERN`)| `FogmAuthError("FOGM returned ok:false with an auth/session error")`| `AUTH_FAILED` |
| `fetcher.ts:150` | JSON envelope has feed error (`ok_false` / `missing_data`)| `FogmFetchError("FOGM feed error (ok_false/missing_data)")` | `FETCH_FAILED` |
| `fetcher.ts:173` | Cumulative time exceeds `FOGM_FETCH_BUDGET_MS` (50s) | `FogmFetchError("Overall fetch time budget exceeded")` | `FETCH_FAILED` |
| `fetcher.ts:201` | `FOGM_BASE_URL` is empty | `FogmEnvMissingError(["FOGM_BASE_URL"])` | `ENV_MISSING` |
| `fetcher.ts:204` | Cookie value is missing or empty | `FogmAuthError("Session cookie value is not provided")` | `AUTH_FAILED` |

---

### 4.3 Deep Dive into `loginAndStore`

1. **Hard Stop Check (`lib/fogm/auth.ts:336`):**
   If `session.consecutiveLoginFailures >= LOGIN_HARD_STOP_AFTER` (5), throws `LoginHardStopError`. Automatic ingestion halts permanently until an admin manually presses "Re-login Now" or credentials change.
2. **Backoff Check (`lib/fogm/auth.ts:337`):**
   If `session.loginBackoffUntil > new Date()`, throws `BackoffActiveError`.
3. **Credentials Hash Reset (`lib/fogm/auth.ts:307-315`):**
   Computes SHA-256 of `${FOGM_USERNAME}|${baseUrl}`. If it differs from `session.credentialsHash`, clears old cookie, resets failures to 0, and unlatches hard stop.
4. **Reauth Lock (`lib/fogm/auth.ts:341-352`):**
   Acquires atomic distributed lock `fogm_reauth_lock` (TTL 60s). If held by another worker, polls `FogmSession` up to 10 seconds for the updated version before throwing `network`.
5. **`postLogin` Request (`lib/fogm/auth.ts:191-205`):**
   - URL: `fogmUrl(baseUrl, "/login.php")`.
   - Body: `JSON.stringify({ username: config.FOGM_USERNAME, password: config.FOGM_PASSWORD })`.
   - Options: `redirect: "manual"`, `cache: "no-store"`, timeout 15,000ms.
6. **`classifyLoginResponse` Order of Checks (`lib/fogm/auth.ts:154-188`):**
   - Check 1: `status === 401 || status === 403` -> `"401"`.
   - Check 2: `status < 200 || status >= 400` -> `"http_error"`.
   - Check 3: JSON error inspection: If body contains `ok: false`, `success: false`, or `status: "error"`, checks message for param/key wording -> returns `"bad_json_keys"` or `"invalid_credentials"`.
   - Check 4: HTML body inspection: If body contains HTML password form or failure keywords -> returns `"html_200_invalid"`.
   - Check 5: Cookie extraction: Calls `pickSessionCookie(cookies)`. If no cookie found -> `"no_set_cookie"`.
   - Check 6: Success -> returns `{ ok: true, cookie, httpStatus }`.
7. **`verifySessionCookie` (`lib/fogm/auth.ts:213-228`):**
   Executes `GET {FOGM_BASE_URL}/api/account.php` with candidate cookie. Returns `true` ONLY if HTTP status is 2xx, body is JSON, and `classifyAccountEnvelope(json).kind === "ok"`.

---

### 4.4 Environment Variables: Code Requirements vs `.env` / `.env.example`

| Variable Name | Required in Live Mode? | Checked in `assertFogmEnv()`? | Present in `.env`? | Present in `.env.example`? | Status / Discrepancies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `FOGM_BASE_URL` | YES | YES (`lib/fogm/env.ts:95`) | YES | YES | Valid |
| `FOGM_USERNAME` | YES | YES (`lib/fogm/env.ts:96`) | YES | YES | Valid |
| `FOGM_PASSWORD` | YES | YES (`lib/fogm/env.ts:97`) | YES | YES | Valid |
| `FOGM_SESSION_ENCRYPTION_KEY` | YES | YES ($\ge 32$ chars) (`env.ts:98`) | YES | YES | Valid |
| `FOGM_PUBLIC_ID_SALT` | YES | YES ($\ge 16$ chars) (`env.ts:99`) | YES | YES | Valid |
| `CRON_SECRET` | YES | YES ($\ge 32$ chars) (`env.ts:100`)| YES | YES | Valid |
| `DATA_SOURCE` | Optional (defaults to mock) | NO (`env.ts:20`) | YES | YES | Valid |
| `MONGODB_URI` | YES (Core DB) | NO (checked in `lib/db.ts:15`) | YES | YES | Valid |
| `SESSION_SECRET` | YES (User Auth) | NO (checked in `lib/session.ts`)| YES | YES | Valid |
| `ADMIN_EMAIL` | YES (Admin Auth) | NO (checked in `lib/admin-auth.ts`)| YES | YES | Valid |
| `ADMIN_PASSWORD` | YES (Admin Auth) | NO (checked in `lib/admin-auth.ts`)| YES | YES | Valid |
| `ADMIN_SESSION_SECRET`| YES (Admin Auth) | NO (checked in `lib/admin-auth.ts`)| YES | YES | Valid |
| `NEXT_PUBLIC_SITE_URL` | YES (CSRF / OG) | NO | YES | YES | Valid |
| `AUTH_OTP_CHANNEL` | OTP.com channel (`email` for this email-only auth flow) | NO | YES | YES | Valid |
| `OTPCOM_BASE_URL` | OTP.com API base URL | NO | YES | YES | Valid |
| `OTPCOM_API_KEY` | OTP.com server API key | NO | YES | YES | Secret |
| `OTPCOM_TIMEOUT_MS` | OTP.com request timeout | NO | YES | YES | Valid |
| `OTPCOM_DEFAULT_LOCALE` | OTP.com locale | NO | YES | YES | Valid |
| `CLOUDINARY_CLOUD_NAME`| Optional (Avatars) | NO | YES | YES | Valid |
| `CLOUDINARY_API_KEY` | Optional (Avatars) | NO | YES | YES | Valid |
| `CLOUDINARY_API_SECRET`| Optional (Avatars) | NO | YES | YES | Valid |

*Result:* `getMissingFogmEnv()` currently returns `[]`. All 6 live-required FOGM variables exist and meet validation criteria. However, documentation in `docs/FOGM_RUNBOOK.md:171` still references the removed name `FOGM_LOGIN_PASSWORD`.

---

### 4.5 All Possible Stored `errorCode` Values & Meanings

| Stored `errorCode` | Originating Function | Exact Cause & Meaning |
| :--- | :--- | :--- |
| `LOGIN_FAILED:verify_failed` | `lib/fogm/auth.ts:364` | Login POST succeeded and returned cookie, but immediate verification GET to `/api/account.php` failed (HTTP 401 or non-OK envelope). **(Current active root cause)** |
| `LOGIN_FAILED:no_set_cookie` | `lib/fogm/auth.ts:187` | Upstream `/login.php` returned HTTP 200 but did not provide any `Set-Cookie` header in response. |
| `LOGIN_FAILED:invalid_credentials` | `lib/fogm/auth.ts:177` | Upstream `/login.php` responded with JSON indicating credentials rejected (`ok: false` or `error`). |
| `LOGIN_FAILED:bad_json_keys` | `lib/fogm/auth.ts:177` | Upstream `/login.php` rejected payload structure (e.g. key names not matching expected username/password). |
| `LOGIN_FAILED:html_200_invalid` | `lib/fogm/auth.ts:183` | Upstream `/login.php` returned HTTP 200 with HTML login form or unauthorized message. |
| `LOGIN_FAILED:401` | `lib/fogm/auth.ts:159` | Upstream `/login.php` returned HTTP 401 or 403 status code. |
| `LOGIN_FAILED:http_error` | `lib/fogm/auth.ts:160` | Upstream `/login.php` returned HTTP 5xx or unhandled 4xx error. |
| `LOGIN_FAILED:network` | `lib/fogm/auth.ts:206, 351` | Network fetch failure, timeout, or timeout waiting for concurrent reauth lock (10s). |
| `LOGIN_BACKOFF` | `lib/fogm/auth.ts:520` | Automated sync was skipped because exponential backoff timer is currently active in `FogmSession`. |
| `LOGIN_HARD_STOP` | `lib/fogm/auth.ts:519` | Automated sync halted because consecutive login failures reached 5. Requires admin "Re-login Now". |
| `AUTH_FAILED` | `lib/fogm/sync-service.ts:552`| Feed fetch returned HTTP 401, redirect, or HTML, and subsequent re-login attempt also failed. |
| `FETCH_FAILED` | `lib/fogm/sync-service.ts:552`| Non-auth HTTP failure during feed fetch (e.g. HTTP 500, broken JSON, connection drop). |
| `INVALID_ROWS_THRESHOLD` | `lib/fogm/sync-service.ts:364`| More than 10% of rows in the feed failed validation. Ingestion aborted with 0 DB writes. |
| `ALL_ROWS_INVALID` | `lib/fogm/sync-service.ts:364`| 100% of feed rows failed validation. Ingestion aborted with 0 DB writes. |
| `ENV_MISSING` | `lib/fogm/auth.ts:518` | One or more of the 6 required FOGM environment variables are missing or too short. |
| `OVERLAP_LOCKED` | `lib/fogm/sync-service.ts:305`| Another sync process is currently executing and holding `fogm_sync_lock`. |
| `REAPED` | `lib/fogm/sync-service.ts:75` | A prior run remained stuck in `"running"` status for $>10$ minutes and was reaped as abandoned. |

---

### 4.6 Ranked Causes of Sync Failure & Single Confirming Checks

```
Rank 1: Multi-Cookie Header Selection Bug in `pickSessionCookie()`
   Evidence: Live smoke test against ReportWise returned:
             `set-cookie names: [PHPSESSID, PHPSESSID]`.
             Testing Cookie #1 against `/api/account.php` produced `HTTP 401 Unauthorized`.
             Testing Cookie #2 against `/api/account.php` produced `HTTP 200 OK` with valid data.
             Code at `lib/fogm/auth.ts:128` uses `cookies.find()` which returns the FIRST (unauthenticated) cookie.
   Confirming Check: Run `npx tsx --env-file=.env scripts/fogm-smoke.ts`.

Rank 2: Login Failure Backoff & Hard-Stop Latching in MongoDB
   Evidence: MongoDB `FogmSession` doc has `consecutiveLoginFailures: 2`, `lastLoginReason: "verify_failed"`,
             and `loginBackoffUntil: "2026-11-01T12:54:15.659Z"`. Runs during this window immediately throw
             `BackoffActiveError`, and after 5 failures trigger `LoginHardStopError`.
   Confirming Check: Query `db.fogm_session.findOne({ _id: "fogm_session" }, { consecutiveLoginFailures: 1, loginBackoffUntil: 1 })`.

Rank 3: Distributed Sync Lock Contention / Left Behind
   Evidence: If a process crashes without releasing `fogm_sync_lock`, `acquireLock` denies all syncs
             for 5 minutes (`LOCK_TTL_SECONDS = 300`).
   Confirming Check: Query `db.fogm_sync_lock.findOne({ _id: "fogm_sync_lock" })`.

Rank 4: Cron Secret / Bearer Header Mismatch on Scheduled Ingestion
   Evidence: `verifySecret()` in `app/api/internal/fogm-sync/route.ts:16-29` enforces 32-char Bearer secret.
             If external cron or Vercel does not supply exact header, returns 401 without running sync.
   Confirming Check: Inspect `FogmHealth.lastCronRunAt` vs current timestamp in database.
```

---

### 4.7 Live Database Inspection (READ-ONLY Queries Executed)

#### Last 20 `FogmSyncRun` Records:
```json
[
  { "trigger": "manual", "startedAt": "2026-11-01T12:53:14.727Z", "status": "auth_failed", "errorCode": "LOGIN_FAILED:verify_failed", "errorMessage": "FOGM login failed: verify_failed" },
  { "trigger": "manual", "startedAt": "2026-11-01T12:48:14.882Z", "status": "auth_failed", "errorCode": "LOGIN_FAILED:verify_failed", "errorMessage": "FOGM login failed: verify_failed" },
  { "trigger": "manual", "startedAt": "2026-11-01T11:22:24.648Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "FOGM login backoff active until 2026-11-01T11:23:10.439Z" },
  { "trigger": "manual", "startedAt": "2026-11-01T11:22:08.697Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "New cookie rejected during feed verification fetch" },
  { "trigger": "manual", "startedAt": "2026-10-31T14:18:50.969Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "New cookie rejected during feed verification fetch" },
  { "trigger": "manual", "startedAt": "2026-10-31T10:13:12.961Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:27:24.030Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:27:19.826Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:27:07.820Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "Received HTTP 401 Unauthorized" },
  { "trigger": "cron",   "startedAt": "2026-10-30T16:27:07.795Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:27:07.753Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:26:40.049Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:24:33.681Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "Received HTTP 401 Unauthorized" },
  { "trigger": "cron",   "startedAt": "2026-10-30T16:24:33.665Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:24:33.634Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:24:16.993Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "Received HTTP 401 Unauthorized" },
  { "trigger": "cron",   "startedAt": "2026-10-30T16:24:16.972Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:24:16.939Z", "status": "completed", "errorCode": null, "errorMessage": null },
  { "trigger": "manual", "startedAt": "2026-10-30T16:23:09.213Z", "status": "auth_failed", "errorCode": "AUTH_FAILED", "errorMessage": "Received HTTP 401 Unauthorized" },
  { "trigger": "cron",   "startedAt": "2026-10-30T16:23:07.776Z", "status": "failed", "errorCode": "FETCH_FAILED", "errorMessage": "Fetch failed on page 1: fetch failed" }
]
```

#### `FogmSession` Document (Secrets Excluded):
```json
{
  "_id": "fogm_session",
  "cookieName": "PHPSESSID",
  "hasEncryptedValue": false,
  "encryptedValueLength": 0,
  "source": "env",
  "version": 1,
  "credentialsHash": "42ea6acaf365ed6c59c3e807dccfd7ae7d18be7ae4bafbac130f4db69c958c1a",
  "credentialsHashMatchesEnv": true,
  "consecutiveLoginFailures": 2,
  "lastLoginReason": "verify_failed",
  "lastLoginError": "verify_failed",
  "lastLoginAttemptAt": "2026-11-01T12:53:15.655Z",
  "loginBackoffUntil": "2026-11-01T12:54:15.659Z",
  "lastVerifiedAt": "2026-10-31T10:13:12.993Z",
  "obtainedAt": "2026-10-31T10:13:12.993Z"
}
```

#### `FogmHealth` Document:
```json
{
  "_id": "fogm_health",
  "lastSuccessAt": "2026-10-31T10:13:13.763Z",
  "lastAuthFailureAt": "2026-11-01T12:53:15.666Z",
  "consecutiveFailures": 5,
  "lastRunStatus": "auth_failed",
  "lastManualRunAt": "2026-11-01T12:53:15.666Z",
  "lastCronRunAt": null,
  "lastAlertSentAt": "2026-11-01T11:22:10.452Z"
}
```

#### Lock Documents (`FogmSyncLock`):
```json
[
  { "_id": "fogm_sync_lock", "locked": false, "lockExpiresAt": null, "currentRunId": null },
  { "_id": "fogm_reauth_lock", "locked": false, "lockExpiresAt": null, "currentRunId": null }
]
```

---

### 4.8 Stale Cookie-Based Paths & Legacy References Remaining

1. `docs/FOGM_RUNBOOK.md:171`: Refers to changing `FOGM_LOGIN_PASSWORD` instead of `FOGM_PASSWORD`.
2. `lib/fogm/fetcher.ts:21`: Default error message strings: `"FOGM session cookie invalid or expired"`.
3. `lib/fogm/fetcher.ts:128`: Error message string: `"Received HTML document instead of JSON (session expired or login redirect)"`.
4. `lib/fogm/fogmApi.ts:71`: Auth regex pattern explicitly matches `expired|session`.
5. `.env.backup-before-cleanup`: Contains legacy variable names `FOGM_API_URL`, `FOGM_COOKIE_NAME`, `FOGM_COOKIE_VALUE`, `FOGM_LOGIN_URL`, `FOGM_LOGIN_USERNAME`, `FOGM_LOGIN_PASSWORD`, `FOGM_SYNC_SECRET`.
6. `FOGM_LEADERBOARD_INVESTIGATION.md:437, 488, 674, 677`: Outdated architectural document describing legacy cookie pasting.

---

### 4.9 Verified Architectural & Logic Drifts

1. **Backoff Ladder Drift:**
   - **Intended:** 1m, 5m, 15m, 1h.
   - **Actual in code (`lib/fogm/auth.ts:131-135`):** `computeBackoffSeconds(failures)` implements `Math.min(900, 30 * Math.pow(2, failures - 1))`, producing: 30s, 60s, 120s (2m), 240s (4m), 480s (8m), capped at 900s (15m). 1 hour is never reached.
2. **Hard-Stop Count:** Verified as exactly `5` (`LOGIN_HARD_STOP_AFTER = 5` in `lib/fogm/auth.ts:21`).
3. **Lock Separation Drift:**
   - Manual sync (`app/api/admin/fogm/sync/route.ts`) and Cron sync (`app/api/internal/fogm-sync/route.ts`) both acquire `LOCK_ID = "fogm_sync_lock"`.
   - Manual re-login (`app/api/admin/fogm/relogin/route.ts`) calls `loginAndStore(true)` which acquires **ONLY** `REAUTH_LOCK_ID = "fogm_reauth_lock"`. It does **not** acquire `fogm_sync_lock`. Consequently, an admin re-login can execute concurrently while a sync run is actively running!
4. **Partial Run Success Drift:**
   - In `lib/fogm/sync-service.ts:501, 524`: When `truncatedSuspected = true`, the run status is recorded as `"partial"`. However, line 524 explicitly executes `await recordHealthStatus(trigger, "completed")`!
   - In `lib/fogm/leaderboard-service.ts:162`: `lastCompletedRun` query explicitly searches for `{ status: { $in: ["completed", "partial"] } }`.
   - **Conclusion:** `partial` runs **DO count as success** in both `FogmHealth` (`lastSuccessAt` is updated) and public leaderboard freshness (`updatedAt`).

---

## 5. Data Model and Storage

All 12 Mongoose models defined in `lib/models/`:

| Model & Collection | Key Fields | Defined Indexes | Who Reads | Who Writes | Status in Live Mode | Keep if Minimal Leaderboard? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FogmRawData** (`fogm_raw_data`) (`lib/models/FogmRawData.ts`) | `login`, `publicId`, `name`, `email`, `group`, `parsed`, 7 money fields, `rankingScore`, `baselineScore`, `isFunded`, `rowHash`, `isActive`, `isTest`, `isTestSource`, `adminHidden`, `currentRank`, `previousRank` | `login` (unique); `publicId` (unique partial); `email`; `rowHash`; `isActive`; `isTest`; `adminHidden`; compound `{ isActive: 1, isTest: 1, adminHidden: 1, rankingScore: -1 }` | `leaderboard-service.ts`, `sync-service.ts`, admin accounts & users API, `/api/stats` | `sync-service.ts` (bulkWrite), `api/admin/fogm/accounts` | **ACTIVE** | **YES (Core)** |
| **FogmRawSnapshot** (`fogm_raw_snapshots`) (`lib/models/FogmRawSnapshot.ts`) | `runId`, `login`, `equity`, `balance`, `credit`, `floating`, `rankingScore`, `fetchedAt` | `runId`; `login`; compound `{ login: 1, fetchedAt: -1 }`; TTL `{ fetchedAt: 1 }` (90 days) | `leaderboard-service.ts` (sparklines & equity history) | `sync-service.ts:470` | **ACTIVE** | **YES (Core)** |
| **FogmSyncRun** (`fogm_sync_runs`) (`lib/models/FogmSyncRun.ts`) | `runId`, `trigger`, `startedAt`, `completedAt`, `status`, `rowsFetched`, `rowsValid`, `rowsInvalid`, `rowsUpserted`, `rowsUnchanged`, `rowsDeactivated`, `truncatedSuspected`, `warnings`, `errorCode`, `errorMessage` | `runId` (unique); `startedAt: -1`; `status` | `api/admin/fogm/status`, `leaderboard-service.ts` | `sync-service.ts:309, 371, 505, 557` | **ACTIVE** | **YES (Core)** |
| **FogmSyncLock** (`fogm_sync_lock`) (`lib/models/FogmSyncLock.ts`) | `_id`, `locked`, `lockedAt`, `lockExpiresAt`, `currentRunId` | `_id` | `sync-service.ts:90`, `lib/fogm/auth.ts:235`, `api/admin/fogm/status` | `sync-service.ts` (acquire/release), `lib/fogm/auth.ts` | **ACTIVE** | **YES (Core)** |
| **FogmSession** (`fogm_session`) (`lib/models/FogmSession.ts`) | `_id`, `cookieName`, `encryptedValue`, `obtainedAt`, `expiresAt`, `lastVerifiedAt`, `source`, `version`, `credentialsHash`, `lastLoginReason`, `consecutiveLoginFailures`, `loginBackoffUntil` | `_id` | `lib/fogm/auth.ts:308, 346, 397`, `api/admin/fogm/status` | `lib/fogm/auth.ts:269, 298, 368, 428` | **ACTIVE** | **YES (Core)** |
| **FogmHealth** (`fogm_health`) (`lib/models/FogmHealth.ts`) | `_id`, `lastSuccessAt`, `lastCronRunAt`, `lastManualRunAt`, `lastAuthFailureAt`, `consecutiveFailures`, `lastAlertSentAt`, `lastRunStatus`, `updatedAt` | `_id` | `api/admin/fogm/status:23`, `leaderboard-service.ts:166` | `sync-service.ts:154-219` | **ACTIVE** | **YES (Core)** |
| **User** (`users`) (`lib/models/User.ts`) | `email`, `name`, `avatarUrl`, `showName`, `showPhoto`, `country`, `profileComplete`, `status`, `lastLoginAt`, `loginCount`, `sessionVersion` | `email` (unique) | `api/auth/verify-otp`, `api/me`, `admin/users`, `leaderboard-service.ts` | `api/auth/verify-otp`, `api/me`, `admin/users` | **ACTIVE** | **YES (Core)** |
| **OtpCode** (`otpcodes`) (`lib/models/OtpCode.ts`) | `email`, `provider`, `providerOtpId`, `channel`, `attempts`, `expiresAt`, `resendAvailableAt` | `email`, `providerOtpId`; TTL `{ expiresAt: 1 }` | `api/auth/request-otp`, `api/auth/resend-otp`, `api/auth/verify-otp` | `api/auth/request-otp`, `api/auth/resend-otp`, `api/auth/verify-otp` | **ACTIVE** | **YES (Core)** |
| **AuditLog** (`auditlogs`) (`lib/models/AuditLog.ts`) | `actor`, `action`, `target`, `before`, `after`, `ip`, `createdAt` | TTL `{ createdAt: 1 }` (180 days) | `app/api/admin/audit/*` | `lib/audit.ts:32` | **ACTIVE** | **YES (Core)** |
| **RateLimit** (`ratelimits`) (`lib/models/RateLimit.ts`) | `key`, `count`, `resetAt` | `key` (unique); TTL `{ resetAt: 1 }` | `lib/rate-limit.ts:24` | `lib/rate-limit.ts:24` | **ACTIVE** | **YES (Core)** |
| **SiteSettings** (`sitesettings`) (`lib/models/SiteSettings.ts`) | `key`, `brand`, `theme`, `contest`, `copy`, `steps`, `rules`, `faqs`, `prizes`, `partners`, `disclosure`, `dataSource`, `maintenance` | `key` (unique) | `lib/settings.ts`, `app/page.tsx`, `LandingClient.tsx` | `app/api/admin/settings/*` | **ACTIVE** | **RETAIN (Minimal)** |
| **Trader** (`traders`) (`lib/models/Trader.ts`) | `name`, `countryCode`, `city`, `netProfit`, `returnPct`, `winRatePct`, `maxDrawdownPct`, `tradesCount`, `volumeLots`, `topInstrument`, `trend`, `period` | Compound `{ period: 1, netProfit: -1 }` | `app/api/admin/traders/route.ts:31` | `app/api/admin/traders/route.ts:73, 101, 125` | **DEAD** | **NO (DELETE)** |

---

## 6. Env and Config Inventory

### 6.1 Exhaustive Environment Variable Inventory (`process.env.*`)

| Env Variable | Code Locations (file:line) | Required in Live? | Required in Mock? | Present in `.env.example`? | Documented in README / Runbook? | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MONGODB_URI` | `lib/db.ts:14`, `scripts/*:10, 15, 27` | **YES** | **YES** | YES | YES (`README.md:38`) | ACTIVE |
| `SESSION_SECRET` | `lib/session.ts:17` | **YES** | **YES** | YES | YES (`README.md:46`) | ACTIVE |
| `ADMIN_EMAIL` | `lib/admin-auth.ts:14, 41, 52`, `api/admin/login:90`, `lib/env.ts:15`, `sync-service.ts:204` | **YES** | **YES** | YES | YES (`README.md:44`) | ACTIVE |
| `ADMIN_PASSWORD` | `lib/admin-auth.ts:15`, `api/admin/login:91`, `lib/env.ts:16` | **YES** | **YES** | YES | YES (`README.md:45`) | ACTIVE |
| `ADMIN_SESSION_SECRET` | `lib/admin-auth.ts:8, 16`, `lib/env.ts:17` | **YES** | **YES** | YES | YES (`README.md:47`) | ACTIVE |
| `DATA_SOURCE` | `lib/fogm/env.ts:52`, `api/leaderboard:12`, `api/stats:5`, `card/[userId]:53`, `rank.ts:15`, `api.ts:15`, `next.config.ts:7` | Optional (default: mock) | Optional | YES | YES (`FOGM_RUNBOOK.md:55`) | ACTIVE |
| `FOGM_BASE_URL` | `lib/fogm/env.ts:53, 95, 127`, `sync-service.ts:12` | **YES** | NO | YES | YES (`FOGM_RUNBOOK.md:56`) | ACTIVE |
| `FOGM_USERNAME` | `lib/fogm/env.ts:54, 96, 137`, `auth.ts:138, 198` | **YES** | NO | YES | YES (`FOGM_RUNBOOK.md:57`) | ACTIVE |
| `FOGM_PASSWORD` | `lib/fogm/env.ts:55, 97, 136`, `auth.ts:199` | **YES** | NO | YES | YES (`FOGM_RUNBOOK.md:57`) | ACTIVE |
| `FOGM_SESSION_ENCRYPTION_KEY` | `lib/fogm/env.ts:56, 98, 138`, `lib/fogm/crypto.ts:7` | **YES** | NO | YES | YES (`FOGM_RUNBOOK.md:58`) | ACTIVE |
| `FOGM_PUBLIC_ID_SALT` | `lib/fogm/env.ts:57, 99`, `lib/fogm/public-id.ts:6` | **YES** | NO | YES | YES (`FOGM_RUNBOOK.md:59`) | ACTIVE |
| `CRON_SECRET` | `lib/fogm/env.ts:58, 100, 139`, `api/internal/fogm-sync:17` | **YES** | NO | YES | YES (`FOGM_RUNBOOK.md:60`) | ACTIVE |
| `NEXT_PUBLIC_SITE_URL` | `lib/http.ts:23`, `app/layout.tsx:11`, `app/robots.ts:4`, `app/u/[userId]:8`, `card/[userId]:57` | **YES** | Optional | YES | YES (`FOGM_RUNBOOK.md:61`) | ACTIVE |
| `NEXT_PUBLIC_DATA_SOURCE` | `next.config.ts:7`, `lib/api.ts:15`, `app/admin/settings:217` | Baked at build | Baked | NO (Generated) | NO | ACTIVE |
| `AUTH_OTP_CHANNEL` | `lib/otpcom.ts` | OTP.com email channel | YES | YES (`README.md`) | ACTIVE |
| `OTPCOM_BASE_URL` | `lib/otpcom.ts` | OTP.com API URL | YES | YES (`README.md`) | ACTIVE |
| `OTPCOM_API_KEY` | `lib/otpcom.ts` | OTP.com credential | YES | YES (`README.md`) | ACTIVE |
| `OTPCOM_TIMEOUT_MS` | `lib/otpcom.ts` | OTP.com timeout | YES | YES (`README.md`) | ACTIVE |
| `OTPCOM_DEFAULT_LOCALE` | `lib/otpcom.ts` | OTP.com locale | YES | YES (`README.md`) | ACTIVE |
| `CLOUDINARY_CLOUD_NAME` | `next.config.ts:3`, `lib/cloudinary.ts:6, 71`, `api/admin/upload/sign:14` | Optional | Optional | YES | YES (`README.md:55`) | ACTIVE |
| `CLOUDINARY_API_KEY` | `lib/cloudinary.ts:7`, `api/admin/upload/sign:15` | Optional | Optional | YES | YES (`README.md:56`) | ACTIVE |
| `CLOUDINARY_API_SECRET` | `lib/cloudinary.ts:8`, `api/admin/upload/sign:16` | Optional | Optional | YES | YES (`README.md:57`) | ACTIVE |
| `FOGM_ALERT_EMAIL` | `lib/fogm/env.ts:28, 59`, `sync-service.ts:204` | Optional | NO | NO | YES (`FOGM_RUNBOOK.md:63`) | ACTIVE |
| `FOGM_GROUP_LIKE` | `lib/fogm/env.ts:29, 60`, `fetcher.ts:225` | Optional | NO | NO | YES (`FOGM_RUNBOOK.md:63`) | ACTIVE |
| `FOGM_GROUP_LIKE_PARAM` | `lib/fogm/env.ts:30, 61`, `fetcher.ts:224` | Optional | NO | NO | YES (`FOGM_RUNBOOK.md:63`) | ACTIVE |
| `FOGM_PAGE_SIZE` | `lib/fogm/env.ts:31, 62`, `fetcher.ts:229` | Optional | NO | NO | YES (`FOGM_RUNBOOK.md:63`) | ACTIVE |
| `FOGM_PAGINATION_MODE` | `lib/fogm/env.ts:32, 63`, `fetcher.ts:227` | Optional | NO | NO | YES (`FOGM_RUNBOOK.md:63`) | ACTIVE |
| `FOGM_PAGE_PARAM` | `lib/fogm/env.ts:33, 64`, `fetcher.ts:228` | Optional | NO | NO | NO | ACTIVE |
| `FOGM_OFFSET_PARAM` | `lib/fogm/env.ts:34, 65`, `fetcher.ts:231` | Optional | NO | NO | NO | ACTIVE |
| `FOGM_LIMIT_PARAM` | `lib/fogm/env.ts:35, 66`, `fetcher.ts:232` | Optional | NO | NO | NO | ACTIVE |
| `FOGM_STALE_AFTER_MINUTES`| `lib/fogm/env.ts:36, 67` | Optional | NO | NO | YES (`FOGM_RUNBOOK.md:63`) | ACTIVE |
| `NODE_ENV` | `lib/admin-auth.ts:28`, `lib/session.ts:24`, `lib/http.ts:36`, `lib/mail.ts:40` | System | System | NO | Standard Node | ACTIVE |
| `MONGODB_TEST_URI` | `__tests__/helpers/test-db.ts:10` | Test Only | Test Only | NO | In `__tests__` helper | ACTIVE (Test) |
| `FOGM_SYNC_SECRET` | `.env.backup-before-cleanup:18` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_LOGIN_URL` | `.env.backup-before-cleanup:35` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_LOGIN_USERNAME` | `.env.backup-before-cleanup:36` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_LOGIN_PASSWORD` | `.env.backup-before-cleanup:37` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_API_URL` | `.env.backup-before-cleanup:50` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_COOKIE_NAME` | `.env.backup-before-cleanup:51` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_COOKIE_VALUE` | `.env.backup-before-cleanup:52` | NO | NO | NO | Stale reference in backup | **DEAD** |
| `FOGM_RANKING_METRIC` | `.env.backup-before-cleanup:53` | NO | NO | NO | Stale reference in backup | **DEAD** |

### 6.2 Non-Env Config Files

1. `vercel.json` (`vercel.json:1-8`):
   - Controls Vercel Cron invocation schedule (`*/10 * * * *`) targeting `/api/internal/fogm-sync`.
2. `next.config.ts` (`next.config.ts:1-31`):
   - Controls: Turbopack CSS loader rules; Cloudinary remote image patterns (`res.cloudinary.com`); serverless bundle tracing (`outputFileTracingIncludes`) bundling fonts in `./assets/fonts/**` for `/api/card/[userId]`; inlining `NEXT_PUBLIC_DATA_SOURCE`.
3. `proxy.ts` (`proxy.ts:1-26`):
   - Controls: Admin routing middleware; redirects any unauthenticated requests to `/admin/:path*` (except `/admin/login`) to `/admin/login`; attaches `x-pathname` header to all downline requests.
4. `lib/defaults.ts` (`lib/defaults.ts:1-165`):
   - Controls: Fallback values for `SiteSettings` (brand title, tagline, default themes, fallback prizes, rules, steps, FAQs).

---

## 7. Clutter and CMS Inventory (Removal Planning Only)

### 7.1 Admin CMS Pages and API Routes

| Path | What It Edits | What Public UI Reads It | Safe to Delete? | Replacement Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `app/admin/contest/page.tsx` | `SiteSettings.contest` (dates, prize fund, currency, stage rules) | `LandingClient.tsx:2353` reads `contest.currency`, `contest.subtitle` | **Needs replacement** | Keep minimal contest title & prize cutoff in Settings; hardcode the rest. |
| `app/admin/prizes/page.tsx` | `SiteSettings.prizes` (prize tiers, rewards, perks) | `LandingClient.tsx:771` (`FETCH.prizes`) | **Needs replacement** | Hardcode prize structure in `lib/defaults.ts`. |
| `app/admin/content/page.tsx` | `SiteSettings.steps`, `rules`, `faqs`, `disclosure` | `LandingClient.tsx:776` (`FETCH.content`) | **Needs replacement** | Hardcode static text in landing page components or `lib/defaults.ts`. |
| `app/admin/design/page.tsx` | `SiteSettings.brand`, `SiteSettings.theme` | `LandingClient.tsx:2293` (accent colors, brand tagline) | **Needs replacement** | Hardcode brand colors in `globals.css` / Tailwind; retain brand name in Settings. |
| `app/api/admin/traders/route.ts` | Legacy manual `Trader` collection CRUD | **NONE** | **YES (Safe to delete immediately)** | None needed; 100% dead code. |
| `app/api/admin/traders/import/route.ts` | CSV import into `Trader` collection | **NONE** | **YES (Safe to delete immediately)** | None needed; 100% dead code. |

### 7.2 Public Landing Page Sections Depending on CMS / Settings

| Component / Section | Data Source | Behavior With Empty DB (`SiteSettings` unseeded) |
| :--- | :--- | :--- |
| **Hero & Header** | `SiteSettings.brand`, `SiteSettings.contest` | Works cleanly: falls back to `DEFAULT_SETTINGS` in `lib/defaults.ts:70`. |
| **Prizes Section** | `lib/api.ts:resolvePrizeTiers` | Works cleanly: falls back to `MOCK_DB.prizeTiers` in `lib/api.ts:711`. |
| **Winners Section** | `lib/api.ts:getWinners` | Works cleanly: derives winners from top 20 of current board or `MOCK_DB`. |
| **Past Editions Section** | `lib/api.ts:getPastEditions` | Works cleanly: always serves `MOCK_DB.pastEditions` marked as Sample data. |
| **Steps / FAQ / Rules / Disclosure** | `lib/api.ts:resolveContent` | Works cleanly: falls back to `MOCK_DB.content` in `lib/api.ts:701-707`. |
| **Activity Ticker** | `lib/fogm/leaderboard-service.ts:getFogmActivity` | Works cleanly: falls back to `mockActivity()` marked as Sample data. |
| **History Chart** | `lib/fogm/leaderboard-service.ts:getFogmEquityHistory` | Works cleanly: falls back to `MOCK_DB.equityHistory` marked as Sample data. |

### 7.3 Dead Code Inventory

- **Unused Models:** `lib/models/Trader.ts` (0 active readers in live mode).
- **Unused Routes:** `app/api/admin/traders/route.ts`, `app/api/admin/traders/import/route.ts`.
- **Unused Scripts:** `scripts/migrate-privacy.ts` (one-off script, not in package.json).
- **Stray / Redundant Documentation:**
  - `FOGM_LEADERBOARD_INVESTIGATION.md` (55 KB legacy report).
  - `FOGM_LIVE_DATA_IMPLEMENTATION_REPORT.md` (historical rewrite notes).
  - `.env.backup-before-cleanup` (stray backup containing obsolete keys).
  - `docs/AUDIT.md` (historical audit).
- **Overlapping API Catalog:** `lib/api-registry.ts` (683 lines): Duplicates API documentation while referencing dead `Trader` routes and missing live `/api/leaderboard`, `/api/stats`, and `/api/admin/fogm/*` routes.

### 7.4 Complexity & Size Hot Spots (> 500 Lines)

1. `components/LandingClient.tsx` (2,220 lines): Monolithic client component mixing ticker, table pagination, podium, modals (avatar, profile, join, share), sparklines, themes, and timer loops.
2. `lib/api.ts` (826 lines): Mixes fake data generation (`MOCK_DB`), client HTTP callers, sample data tagging (`WeakSet`), live content adaptation, and date math.
3. `app/admin/page.tsx` (814 lines): Combines dashboard CRM metrics, registration charts, FOGM sync health cards, manual sync/relogin action handlers, and error toasts.
4. `app/admin/leaderboard/page.tsx` (693 lines): Combines raw feed account tables, drawer inspection, sync triggers, search filters, and CSV streaming.
5. `components/JoinModal.tsx` (680 lines): Combines 4 distinct wizard steps (email OTP request, OTP code verification, profile detail entry, Cloudinary photo upload, and rank card generation).
6. `app/admin/users/page.tsx` (653 lines): Combines user management tables, bulk actions, drawer editing, CSV export, and FOGM account linking logic.
7. `lib/fogm/fogmApi.ts` (556 lines): Combines pure validation schemas, Zod definitions, group parsing, money coercion, and embedded Markdown API docs.
8. `lib/fogm/sync-service.ts` (523 lines): Combines distributed locking, stale run reaping, feed fetching, re-auth trigger, SHA-256 row hashing, batch DB writes, snapshots, deactivation sweep, and email alerts.
9. `app/admin/api-docs/page.tsx` (507 lines): Interactive API viewer combined with live endpoint fetch testing harness.

---

## 8. Target Admin Architecture & Feasibility

### 8.1 Target Admin Page Mapping

Target pages: **Dashboard, FOGM Users, Users, Settings, Audit Log, API Docs.**

| Target Page | Current Route / Nav Item | Status | Dependencies & What Breaks if Old Pages Removed |
| :--- | :--- | :--- | :--- |
| **1. Dashboard** | `/admin` (`app/admin/page.tsx`) | RETAIN | Calls `/api/admin/stats` and `/api/admin/fogm/status`. No dependencies on CMS pages. |
| **2. FOGM Users** | `/admin/leaderboard` (`app/admin/leaderboard/page.tsx`) | RENAME | Calls `/api/admin/fogm/accounts/*` and `/api/admin/fogm/sync`. Self-contained. |
| **3. Users** | `/admin/users` (`app/admin/users/page.tsx`) | RETAIN | Calls `/api/admin/users/*`. Reads `User` and joins with `FogmRawData`. Self-contained. |
| **4. Settings** | `/admin/settings` (`app/admin/settings/page.tsx`) | RETAIN & CONSOLIDATE | Currently calls `/api/admin/settings`, `/api/admin/test-email`, `/api/admin/settings/revalidate`. If `/admin/contest`, `/admin/prizes`, `/admin/content`, `/admin/design` are removed: Remove their nav links in `AdminShell.tsx:48-92`. Their removal does **not** break `proxy.ts` (which matches `/admin/:path*`). |
| **5. Audit Log** | `/admin/audit` (`app/admin/audit/page.tsx`) | RETAIN | Calls `/api/admin/audit/*`. Self-contained. |
| **6. API Docs** | `/admin/api-docs` (`app/admin/api-docs/page.tsx`) | RETAIN | Reads `FOGM_API_DOCS` and `API_REGISTRY`. Self-contained. |

### 8.2 Minimal Settings Analysis

Which `SiteSettings` keys are actually required by live code vs never read:

- **Must Stay (Read by Live Code):**
  - `brand.name`: Read in `LandingClient.tsx:2357`, `app/layout.tsx:16`, `app/admin/layout.tsx:49`.
  - `brand.tagline`: Read in `LandingClient.tsx:2357`.
  - `maintenance.enabled` & `maintenance.message`: Read in `LandingClient.tsx:2302`.
  - `contest.prizeFund` & `prizes[].ranksTo`: Read in `lib/fogm/leaderboard-service.ts:117, 262` to determine winning rank cutoff (top 20) and display prize fund.
- **Never Read / Can Be Discarded or Hardcoded:**
  - `dataSource`: Never read by live routing (`process.env.DATA_SOURCE` is used).
  - `copy`: Map is unread.
  - `partners`: Unread by live code.
  - `brand.logoLight`, `logoDark`, `favicon`, `ogImage`: Landing page uses SVG assets directly (`assets/`, `public/`).
  - `theme.light.*`, `theme.dark.*`: Defaults in `globals.css` are sufficient.
  - `steps`, `rules`, `faqs`, `disclosure`: Can be static hardcoded components.

### 8.3 What Dashboard Needs
- **Needs:** Feed sync health (success/failure status, last success time, cron freshness), session state (cookie name, backoff, failures), active account count, unlinked account count, recent sync runs table, registered CRM users count, signups chart.
- **Supplying Endpoints:**
  - `/api/admin/fogm/status`: Supplies all sync health, session states, run history, and feed account counts (`app/api/admin/fogm/status/route.ts:47-103`).
  - `/api/admin/stats`: Supplies user signup metrics and CRM overview (`app/api/admin/stats/route.ts:14-80`).

---

## 9. Users Must Exist in FOGM (Feasibility Investigation)

### 9.1 Sign-Up & Sign-In Flow Today
1. User requests OTP via `POST /api/auth/request-otp` (`app/api/auth/request-otp/route.ts:13`).
   - Normalizes email (`trim().toLowerCase()`).
   - Generates OTP, stores hash in `OtpCode`, sends email.
   - **No check against FOGM feed.**
2. User enters OTP code via `POST /api/auth/verify-otp` (`app/api/auth/verify-otp/route.ts:14`).
   - Verifies OTP hash.
   - Lines 51-68: **Upserts `User` document unconditionally** (`User.findOneAndUpdate({ email }, { $setOnInsert: ... }, { upsert: true })`).
   - Issues JWT session cookie `fogm_session_user` (`lib/session.ts:39`).
3. Client loads profile via `GET /api/me` (`app/api/me/route.ts:12`).
   - Calls `resolveRankEntry(userId)` (`lib/fogm/leaderboard-service.ts:313`).
   - Queries `FogmRawData.findOne({ ...eligibleFilter(), email })`.
   - If user email is NOT in FOGM feed: `resolveRankEntry` returns `null`.
   - `GET /api/me` returns `{ user: {...}, entry: null }`.
   - User is signed in, prompt opens to complete profile, but rank card is missing and user is unranked.

### 9.2 Where the "Email in FOGM" Check Can Go

#### Option A: Before sending OTP (`app/api/auth/request-otp/route.ts`)
- **Mechanism:** In `request-otp/route.ts:18`, before generating code, query `FogmRawData.exists({ email })`. If false, reject request.
- **User Experience:** User enters email, clicks "Continue", immediately sees error toast: *"No trading account found with this email. Please register with your MetaTrader account email."*
- **Files Modified:** `app/api/auth/request-otp/route.ts:18` (PROTECTED FILE).
- **Pros:** Zero OTP emails sent to non-traders; zero phantom user records created.
- **Cons:** Exposes email enumeration (reveals whether an email trades with the brokerage).

#### Option B: Before creating User (`app/api/auth/verify-otp/route.ts`)
- **Mechanism:** In `verify-otp/route.ts:50`, after OTP code is verified, query `FogmRawData.findOne({ email })`. If not found, return `fail(403, "not_in_fogm", { message: "No trading account found." })`.
- **User Experience:** OTP is verified, but user is told their account is not in the tournament feed; no `User` record or session cookie is created.
- **Files Modified:** `app/api/auth/verify-otp/route.ts:50` (PROTECTED FILE).
- **Pros:** No email enumeration before OTP proof; completely stops non-FOGM user creation in DB.

#### Option C: At Profile Completion (`app/api/me/route.ts`)
- **Mechanism:** User logs in, but `/api/me` marks `canJoin: false` or blocks PATCH until feed account links.
- **Files Modified:** `app/api/me/route.ts:50`, `components/JoinModal.tsx`.
- **Cons:** Leaves unlinked `User` records in MongoDB; confusing two-tier state.

### 9.3 Admin "Users" Page Capabilities
- `app/admin/users/page.tsx:305-320` **already has** a "FOGM Feed" column that renders `<Badge variant="mute">Unlinked</Badge>` or linked account pills with login, equity, and rank.
- Filter dropdown (`page.tsx:433-444`) already has `"FOGM Linked"` and `"No Linked Account"`.
- If rule is enforced, existing unlinked users can be identified via the `fogmLinked="unlinked"` filter and cleaned up via bulk delete (`page.tsx:220`).

### 9.4 Edge Cases
1. **Email Case & Whitespace:** `FogmRawData` normalizes emails with `email.toLowerCase().trim()` (`lib/fogm/account-mapper.ts:28`). Auth routes must strictly match with `.toLowerCase().trim()`.
2. **One Email With Multiple Logins:** Supported. `FogmRawData.find({ email })` returns all accounts; leaderboard service picks the one with highest `rankingScore` (`lib/fogm/leaderboard-service.ts:208, 332`).
3. **Account Flagged as Test / Hidden / Inactive / Unfunded:**
   - If user exists in feed but has `isFunded: false` or `isTest: true`:
   - If check requires *any* record in `FogmRawData`: user can sign up, but `resolveRankEntry` returns `null` (unranked).
   - If check requires *eligible* record in `FogmRawData` (`eligibleFilter()`): user is blocked from signing up until they fund their account.
4. **Feed Temporarily Empty or Sync Failing:**
   - If sync is failing or feed is empty, a strict check would block ALL valid traders from logging in!
   - Recommended safeguard: Check `FogmHealth.consecutiveFailures < 5` and `FogmRawData.countDocuments() > 0` before hard-blocking.

---

## 10. Tests and Scripts

### 10.1 Test Suites (`__tests__/`)

| Test File | Lines | Coverage / Scope | Database Dependency | Tests Dead Code? |
| :--- | :--- | :--- | :--- | :--- |
| `__tests__/fogm-feed-validation.test.ts`| 323 | Pure unit tests for `fogmApi.ts`: row validation, money coercion, NaN rejection, envelope classification, derived scores. | None (pure in-memory) | NO |
| `__tests__/fogm-fetcher.test.ts` | 210 | Feed fetcher pagination, deadline budgets, retry counts, HTML error classification using mocked fetch. | None (mocked fetch) | NO |
| `__tests__/fogm-parser.test.ts` | 63 | Group string parsing across live server variants. | None (pure in-memory) | NO |
| `__tests__/fogm-reauth.test.ts` | 60 | AES-256-GCM encryption round-trip, tampering detection, backoff ladder computation. | None (pure in-memory) | NO |
| `__tests__/live-fixes.test.ts` | 164 | Regression tests for live bugfixes (publicId uniqueness, maskName unicode, etc.). | None (pure in-memory) | NO |
| `__tests__/fogm-sync.test.ts` | 402 | End-to-end integration tests for `runFogmSync`: upserts, hash comparisons, snapshots, sweep, rank recalculations. | **Requires `*_test` MongoDB** (Skips cleanly if unavailable) | NO |

### 10.2 Scripts Inventory

| Script | Location | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `pnpm dev` | `package.json:6` | Starts Next.js development server (`next dev`) | **ACTIVE** |
| `pnpm build` | `package.json:7` | Compiles Next.js production bundle (`next build`) | **ACTIVE** |
| `pnpm start` | `package.json:8` | Starts production server (`next start`) | **ACTIVE** |
| `pnpm lint` | `package.json:9` | Runs ESLint across project (`eslint`) | **ACTIVE** |
| `pnpm test` | `package.json:10` | Runs test runner (`tsx --test __tests__/**/*.test.ts`) | **ACTIVE** |
| `pnpm fogm:indexes` | `package.json:11`, `scripts/init-fogm-indexes.ts` | Creates MongoDB indexes for FOGM collections | **ACTIVE** |
| `pnpm fogm:smoke` | `package.json:12`, `scripts/fogm-smoke.ts` | Read-only diagnostic CLI test against live upstream ReportWise API | **ACTIVE** |
| `pnpm rebrand:settings`| `package.json:13`, `scripts/rebrand-settings.ts` | Scans and migrates "FOGM" strings to "Trading Pips" in SiteSettings | **ACTIVE (One-off)** |
| `scripts/migrate-privacy.ts`| `scripts/migrate-privacy.ts` | Legacy migration for `publicConsent` to `showName/showPhoto` | **DEAD** |

---

## A. Top 10 Problems (Ranked, With file:line)

1. **Multi-cookie selection picks unauthenticated session cookie:** `lib/fogm/auth.ts:128` uses `cookies.find(...)` which grabs the first `PHPSESSID` rather than the second regenerated authenticated cookie returned by PHP, failing all subsequent verification GETs with HTTP 401.
2. **Permanent hard-stop after 5 failures halts ingestion:** `lib/fogm/auth.ts:336` permanently throws `LoginHardStopError` after 5 consecutive failures, halting all scheduled cron runs until an admin manually presses "Re-login Now".
3. **`SiteSettings.dataSource` is completely disconnected from live code:** `lib/models/SiteSettings.ts:38, 87` maintains a `dataSource` enum that is never read by server routes (`lib/api.ts:15`, `app/api/leaderboard/route.ts:12` read `process.env.DATA_SOURCE`), misleading admins in the settings UI.
4. **Dead `Trader` model and CRUD endpoints remain in codebase:** `lib/models/Trader.ts:1-45`, `app/api/admin/traders/route.ts:1-129`, and `app/api/admin/traders/import/route.ts:1-94` exist and are documented in `lib/api-registry.ts:427-565` despite zero usage in the UI.
5. **Re-login lock and sync lock are separate, permitting race conditions:** `app/api/admin/fogm/relogin/route.ts:36` acquires `fogm_reauth_lock` while `app/api/admin/fogm/sync/route.ts:28` acquires `fogm_sync_lock`, allowing admin re-login to mutate `FogmSession` while a sync run is executing.
6. **Partial runs incorrectly record completed status in health metrics:** `lib/fogm/sync-service.ts:524` calls `recordHealthStatus(trigger, "completed")` even when `runStatus === "partial"` due to suspected feed truncation.
7. **Exponential backoff ladder in code drifts from intended schedule:** `lib/fogm/auth.ts:134` caps backoff at 15 minutes (`Math.min(900, ...)`) rather than reaching the intended 1 hour.
8. **Runbook documentation references obsolete environment variable name:** `docs/FOGM_RUNBOOK.md:171` instructs admins to test with `FOGM_LOGIN_PASSWORD` instead of `FOGM_PASSWORD`.
9. **Monolithic UI components create severe maintenance bottlenecks:** `components/LandingClient.tsx:1-2377` (2,220 lines) and `app/admin/page.tsx:1-858` (814 lines) combine state, data loaders, modals, SVG sparklines, and admin tables in single files.
10. **Users can register and exist in DB without being in FOGM feed:** `app/api/auth/verify-otp/route.ts:51-68` unconditionally upserts `User` records without verifying if their email exists in `FogmRawData`.

---

## B. "Sync Fails" Diagnosis: Ranked Causes & Confirming Checks

```
+------------------------------------------------------------------------------------------------------------------------+
| 1. Upstream PHP Session Regeneration Cookie Bug (CONFIRMED ROOT CAUSE)                                                 |
|    - Cause: ReportWise login issues two Set-Cookie headers: initial unauthenticated and authenticated.                   |
|             Code picks the first one, which returns HTTP 401 on `/api/account.php`.                                    |
|    - Confirming Check: Run `npx tsx --env-file=.env scripts/fogm-smoke.ts`.                                            |
+------------------------------------------------------------------------------------------------------------------------+
| 2. MongoDB Backoff / Hard-Stop Latching                                                                                |
|    - Cause: Consecutive failures from Cause #1 trigger backoff and hard stop, preventing subsequent syncs.             |
|    - Confirming Check: Query `db.fogm_session.findOne({ _id: "fogm_session" })`.                                       |
+------------------------------------------------------------------------------------------------------------------------+
| 3. Distributed Sync Lock Held                                                                                          |
|    - Cause: In-flight or crashed run leaves `fogm_sync_lock` active for up to 300 seconds.                             |
|    - Confirming Check: Query `db.fogm_sync_lock.findOne({ _id: "fogm_sync_lock", locked: true })`.                     |
+------------------------------------------------------------------------------------------------------------------------+
| 4. Scheduled Ingestion Inactive (Cron Not Running / Secret Mismatch)                                                   |
|    - Cause: Vercel Cron not firing on Hobby tier or Bearer secret header mismatch on `/api/internal/fogm-sync`.          |
|    - Confirming Check: Inspect `FogmHealth.lastCronRunAt` vs current wall-clock time.                                  |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## C. Keep / Delete / Merge Table for Files and Routes

| File / Route Path | Decision | Reason | Risk |
| :--- | :--- | :--- | :--- |
| `lib/models/Trader.ts` | **DELETE** | Legacy manual CRUD model; 0 active readers in live mode. | Low (only imported by dead trader routes). |
| `app/api/admin/traders/route.ts` | **DELETE** | Legacy CRUD endpoint; uncalled by any UI component. | Low (remove entry from `api-registry.ts`). |
| `app/api/admin/traders/import/route.ts`| **DELETE** | Legacy CSV import endpoint; uncalled by any UI component. | Low. |
| `scripts/migrate-privacy.ts` | **DELETE** | One-off historical migration script; not referenced in package.json. | None. |
| `.env.backup-before-cleanup` | **DELETE** | Stale backup file containing outdated environment variables. | None. |
| `FOGM_LEADERBOARD_INVESTIGATION.md` | **DELETE** | 55 KB legacy investigation document; superseded by this map. | None. |
| `docs/AUDIT.md` | **DELETE** | Outdated audit notes from early development. | None. |
| `lib/env.ts` | **DELETE** | Redundant legacy environment validator; superseded by `lib/fogm/env.ts`.| Low (check imports). |
| `app/admin/contest/page.tsx` | **DELETE / MERGE** | Redundant CMS editor. Minimal settings (currency, title) can merge into Settings. | Low. |
| `app/admin/prizes/page.tsx` | **DELETE / MERGE** | Redundant CMS editor. Static prize tiers should live in `lib/defaults.ts`. | Low. |
| `app/admin/content/page.tsx` | **DELETE / MERGE** | Redundant CMS editor for static rules/steps/FAQs. | Low. |
| `app/admin/design/page.tsx` | **DELETE / MERGE** | Redundant CMS editor for themes/colors. | Low. |
| `lib/api-registry.ts` | **MERGE / UPDATE**| Documents dead trader routes and omits live FOGM endpoints. | Low (update catalog). |
| `lib/fogm/auth.ts` | **KEEP & FIX** | Core live authentication engine. Needs pickSessionCookie multi-cookie fix. | Critical core file. |
| `lib/fogm/sync-service.ts` | **KEEP** | Core ingestion engine. | Critical core file. |
| `lib/fogm/fetcher.ts` | **KEEP** | Core feed fetcher. | Critical core file. |
| `lib/fogm/fogmApi.ts` | **KEEP** | Single source of truth for schemas, validation, constants. | Critical core file. |
| `app/admin/page.tsx` | **KEEP** | Core admin dashboard. | High (break into smaller sub-components). |
| `components/LandingClient.tsx` | **KEEP** | Core landing page. | High (break into smaller modular sections). |
| `app/api/internal/fogm-sync/route.ts` | **KEEP** | Core cron ingestion endpoint. | Critical core file. |

---

## D. UNVERIFIED List

1. **Upstream Logout Endpoint (`/logout.php`):** Referenced in `lib/fogm/fogmApi.ts:28` and `scripts/fogm-smoke.ts:72`. While `POST /logout.php` returned HTTP 200 during smoke testing, whether it actually invalidates the session server-side is unverified with ReportWise.
2. **MetaTrader Broker Group Token `-H-`:** In `lib/fogm/group-parser.ts:16` and `lib/models/FogmRawData.ts:9`, `-H-` is parsed as `isHedging: true`. Whether this token denotes Hedging is unconfirmed with FOGM.
3. **ReportWise Pagination Support:** `scripts/fogm-smoke.ts` and live checks confirm ReportWise currently returns all accounts in a single request (`count: 2`, `mode: "group"`). Whether ReportWise supports server-side `page` or `offset` parameters when the account count exceeds 500 remains unverified against a large dataset.
4. **Whether Feed Ever Emits Numbers as Strings:** `coerceFeedNumber` in `lib/fogm/fogmApi.ts:242` handles both numbers and numeric strings. Live responses returned numbers, but string behavior on edge cases remains unverified.
