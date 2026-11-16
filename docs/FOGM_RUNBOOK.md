# FOGM Live Data Integration Runbook

This runbook covers the end-to-end operation, deployment, monitoring, rotation, and testing of the FOGM live MetaTrader feed integration for the trading championship leaderboard.

---

## 1. Architecture & Ingestion Flow

```
+-------------------------------------------------------------+
|                 ReportWise / FOGM API                       |
|           POST <FOGM_BASE_URL>/login.php (automatic login)   |
|           GET  <FOGM_BASE_URL>/api/account.php (session cookie)|
+-------------------------------------------------------------+
                              |
                              v (every 10 minutes via cron or manual trigger)
+-------------------------------------------------------------+
|                 Ingestion Engine (sync-service.ts)           |
|  - Stale Run Reaper (reaps stalled runs > 10m)               |
|  - Distributed Atomic Overlap Lock (FogmSyncLock, TTL 5m)   |
|  - Heartbeat Lock Extension per Page & Batch                 |
|  - Re-Auth Engine (FogmSession AES-256-GCM + CAS rotation)   |
|  - Auth Failure Detection & Automatic Single-Flight Re-Login |
|  - 50s Fetch Deadline & Defensive Pagination Guards          |
|  - SHA-256 Row Hashing (Idempotent 0-write reruns)           |
|  - 500-Batch Upserts into MongoDB (FogmRawData)              |
|  - Public Obfuscated IDs (fogm_<hmac> using FOGM_PUBLIC_ID_SALT)
|  - Time-series Snapshot Recording (FogmRawSnapshot, 90d TTL) |
|  - Circuit Breaker Deactivation Sweep (>50% drop aborted)   |
|  - Rank Recomputation (rankingScore = Equity − Credit)       |
+-------------------------------------------------------------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
+-------------------------------+ +-------------------------------+
|      Public Read Layer        | |       Admin Management        |
| - /api/leaderboard (cached)   | | - /admin (Health & Telemetry) |
| - /api/stats (aggregate)      | | - /admin/leaderboard (Table)  |
| - Masked Names & Logins       | | - "Re-login Now" Admin Action |
| - Opaque IDs (fogm_<hash>)    | | - CSV Streaming Export        |
| - PII Guard (Emails Excluded) | | - Manual One-Click Ingestion  |
| - Share Cards (/u/[userId])   | | - Stale Cron Inactive Banner  |
+-------------------------------+ +-------------------------------+
```

---

## 2. Environment Variables Reference

Only these are needed for the live feed (names only; never commit values):

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATA_SOURCE` | yes | `mock` (demo data) or `fogm` (live feed). |
| `FOGM_BASE_URL` | fogm | Feed origin, e.g. `https://feed.example.com`. Paths `/login.php` and `/api/account.php` are constants in `lib/fogm/fogmApi.ts`. |
| `FOGM_USERNAME` / `FOGM_PASSWORD` | fogm | Service login. Sent as JSON `{"username","password"}` (keys: `LOGIN_BODY_KEYS`). |
| `FOGM_SESSION_ENCRYPTION_KEY` | fogm | 32-byte key (64 hex chars) for AES-256-GCM session storage. |
| `FOGM_PUBLIC_ID_SALT` | fogm | ≥16 chars, salt for `fogm_<hmac>` public ids. |
| `CRON_SECRET` | fogm | ≥32 chars, Bearer secret for `/api/internal/fogm-sync`. |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://tradingpips.io` in production (metadata, share links, CSRF allowlist incl. `www.`). |

Alert emails are automatically routed to `ADMIN_EMAIL`. Pagination mode (`"none"`), page size (`500`), stale threshold (`30m`), and endpoints are configured directly as application constants in `lib/fogm/fogmApi.ts`.

**Removed:** `FOGM_API_URL`, `FOGM_LOGIN_URL`, `FOGM_LOGIN_USERNAME`, `FOGM_LOGIN_PASSWORD`, `FOGM_LOGIN_BODY_TEMPLATE`, `FOGM_COOKIE_NAME`, `FOGM_COOKIE_VALUE`, `FOGM_SYNC_SECRET`, `FOGM_RANKING_METRIC`, `FOGM_ALERT_EMAIL`, `FOGM_GROUP_LIKE*`, `FOGM_PAGE_*`, `FOGM_STALE_AFTER_MINUTES`. There is no cookie to paste: the app logs in by itself.

---

## 3. Automatic Re-Authentication & Cookie Management

The platform features an automated re-authentication engine backed by `FogmSession` in MongoDB:

### 3.1 Automated Lifecycle
1. **Sliding Sessions**: Every successful fetch extracts incoming `Set-Cookie` headers and updates `expiresAt` via optimistic concurrency (CAS).
2. **On-Demand Re-Login**: If a fetch returns 401, HTML login redirects, or invalid JSON, the sync service acquires a single-flight lock (`fogm_reauth_lock`), logs in via `FOGM_LOGIN_URL`, verifies the new cookie against the feed, encrypts it with AES-256-GCM, and immediately retries the sync.
3. **Exponential Backoff**: If login credentials fail repeatedly, the system applies a backoff ladder (1m, 5m, 15m, 1h; hard stop after 5 consecutive failures) and sends an alert email to `ADMIN_EMAIL`.
4. **Admin Re-login**: Admins can force an immediate credential re-authentication from the `/admin` dashboard using the **Re-login Now** button.

### 3.2 Session states (admin health card)
`session_ok`, `not_logged_in` (logs in on next sync), `relogin_in_progress`, `login_failed (reason)`, `backoff_until`, `hard_stopped` (5 failures), `env_missing (names)`.
Login failure reasons: `network`, `401`, `http_error`, `html_200_invalid`, `bad_json_keys`, `invalid_credentials`, `no_set_cookie`, `verify_failed`.
**Re-login Now** clears backoff/hard stop and logs in immediately. Changing `FOGM_USERNAME` or `FOGM_BASE_URL` also clears them (a hash of username+base URL is stored on the session doc).
Diagnose without touching the DB: `pnpm fogm:smoke`.

---

## 4. Cron Deployment & Scheduling

### Option A (Default): Built-in In-Process Scheduler
The platform includes an automated in-process scheduler initialized via `instrumentation.ts` at server boot.
- **Zero configuration**: Runs automatically in both `pnpm dev` and `next start` when `DATA_SOURCE=fogm`.
- **Timing**: First sync executes ~30 seconds after server boot, followed by recurring ticks every 10 minutes (`CRON_INTERVAL_MS`).
- **Disable if needed**: Set `FOGM_INTERNAL_CRON=off` to disable the built-in scheduler (e.g. when relying exclusively on systemd timers or crontab).
- **Execution requirement**: Must run as a persistent, long-lived server process (such as via PM2 or systemd), not on a serverless platform. If running across multiple instances or a PM2 cluster, the distributed MongoDB lock (`fogm_sync_lock`) ensures single-flight cross-process safety.

### Option B (Backup): Linux Crontab
If you prefer triggering syncs externally from the host or another cron worker:
```bash
*/10 * * * * curl -fsS -X POST http://127.0.0.1:3000/api/internal/fogm-sync \
  -H "Authorization: Bearer $CRON_SECRET" > /dev/null 2>&1
```

### Option C: Systemd Service & Timer
To manage the Next.js production process and an optional standalone systemd timer on a Linux VPS:

**/etc/systemd/system/tradingpips.service**:
```ini
[Unit]
Description=Trading Pips Leaderboard Next.js Server
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/var/www/tradingpips
EnvironmentFile=/var/www/tradingpips/.env
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**/etc/systemd/system/tradingpips-sync.timer**:
```ini
[Unit]
Description=Trigger Trading Pips Feed Sync Every 10 Minutes

[Timer]
OnBootSec=1min
OnUnitActiveSec=10min
Persistent=true

[Install]
WantedBy=timers.target
```

**/etc/systemd/system/tradingpips-sync.service**:
```ini
[Unit]
Description=Trading Pips Sync Worker

[Service]
Type=oneshot
ExecStart=/usr/bin/curl -fsS -X POST http://127.0.0.1:3000/api/internal/fogm-sync -H "Authorization: Bearer $CRON_SECRET"
```

### Option D: Manual Admin Trigger
Admins can trigger an ad-hoc sync at any time via the **Sync Now** button on `/admin`. Returns HTTP 409 if a sync run is currently holding the distributed lock.

---

## 5. End-to-End Manual QA Script

Follow these steps on staging or production to verify complete functionality:

### Step 1: Ingest Sample FOGM Data
Call the sync endpoint with sample data or trigger a live fetch:
```json
{
  "ok": true,
  "count": 2,
  "scope": { "mode": "group", "group_like": "%RishabhMisra%" },
  "data": [
    {
      "login": 6000153,
      "name": "WD Test",
      "email": "wd.test@example.com",
      "group": "real\\F1SL-FX-2-RishabhMisra",
      "balance": 0, "credit": 0, "floating": 0, "equity": 0, "margin": 0, "margin_free": 0, "margin_level": 0
    },
    {
      "login": 6001410,
      "name": "Sagar Siddhu",
      "email": "sagar.siddhu@example.com",
      "group": "real\\F1SL-FX-2-H-RishabhMisra",
      "balance": 20, "credit": 0, "floating": 0, "equity": 20, "margin": 0, "margin_free": 20, "margin_level": 0
    }
  ]
}
```

### Step 2: Test Account Auto-Exclusion & Leaderboard Count
1. Visit the public leaderboard (`/`).
2. **Verify**: Account `6000153` ("WD Test") is **NOT** visible on the public leaderboard. "Test" as a word in its name sets `isTest: true` on first sight; its 0 balance/equity separately sets `isFunded: false` (unfunded is not the same as test).
3. **Verify**: The admin health card shows `Active (Leaderboard): 1` and `Test Flagged: 1`, correctly separating test accounts from eligible leaderboard participants.
4. Visit `/admin/leaderboard`: Account `6000153` appears with a red `Test` badge.

### Step 3: Identity & Privacy Linking
1. Visit `/`.
2. **Verify**: Account `6001410` is displayed with masked name **"Sagar S."** and masked login **"••1410"**.
3. **Verify**: Neither `sagar.siddhu@example.com` nor full MT login `6001410` appear in the DOM or API response.
4. Log in as a participant using `sagar.siddhu@example.com`.
5. **Verify**: The leaderboard sticky bar displays "You (#1)" with Sagar Siddhu's live equity ($20.00).

### Step 4: Avatar Upload & Share Card Verification (Hard Constraints)
1. In user profile, upload a custom avatar image.
2. **Verify**: Avatar uploads to Cloudinary without error.
3. Open the user share card page `/u/<userId>`.
4. **Verify**: The share card renders with the custom avatar, live Rank #1, Net Equity ($20.00), and dynamic contest participant counts.
5. Download/copy share card link: Verify OG image endpoint `/api/card/<userId>` generates a PNG with exact typography and layout.

### Step 5: Data Freshness & Stale Indicators
1. Check the landing page header:
   - When last sync was < 30 minutes ago: Shows **"Live · updated Xm ago"** with green dot.
   - When last sync was > 30 minutes ago: Shows **"Delayed"** with amber dot.

### Step 6: Auth Failure & Automatic Recovery Check
1. Change `FOGM_PASSWORD` temporarily or simulate a 401 error.
2. Trigger sync: `POST /api/admin/fogm/sync`.
3. **Verify**: Returns error without leaking credentials or secret values in logs.
4. **Verify**: Restore credentials and click **Re-login Now** in `/admin`: session doc updates with `source: "login"`.

---

## 6. Zero-Downtime Rollback Procedure

If FOGM feed data causes unexpected behavior or the external API is offline:
1. Set environment variable:
   ```bash
   DATA_SOURCE=mock
   ```
2. Redeploy or restart the application.
3. **Verification**:
   - The public leaderboard immediately switches back to the deterministic 50-trader mock dataset.
   - `/api/leaderboard` returns mock traders without downtime.
   - Database records in `fogm_raw_data` remain preserved for investigation.

---

## 7. Feed Response Handling (`GET /api/account.php`)

The authoritative response format, field table, validation rules, warning conditions and derived-field rules live in `FOGM_API_DOCS` in `lib/fogm/fogmApi.ts` and render on **/admin/api-docs** ("Upstream feed" card). Summary:

### 7.1 Envelope
| Condition | Result |
| :--- | :--- |
| `ok:false` with unauthorized/session/login wording | `FogmAuthError` → one automatic re-login, then `auth_failed` |
| `ok:false` otherwise, or `data` missing | Retryable feed error (3 attempts) → `failed` |
| `ok:true`, `data: []` | `completed` with `empty_feed` warning, **no deactivations** |
| `count !== data.length` | `countMismatch` warning; `count > data.length` also sets `truncatedSuspected` |
| `data.length >= 500` in pagination mode `none` | `truncatedSuspected` → status `partial`, sweep skipped |
| Same `login` twice | Last occurrence kept, `duplicatesInResponse` counted |
| `scope` differs from the previous run | `scope_changed` warning (recorded as `feedScope`, never trusted or sent back) |

Response bodies are never logged or stored.

### 7.2 Rows
- Each row is validated on its own. `login` integer > 0, `email` lower+trim and email-shaped, `name` trimmed/collapsed (empty allowed), `group` string, the 7 money fields number or numeric string, finite, rounded to 2 dp.
- **A missing money field invalidates the row** (it is not defaulted to 0, which would fake equity).
- Invalid rows are skipped; only the reason code (e.g. `equity_missing`, `email_invalid`) is counted in `invalidReasons` on the run.
- More than 10% invalid, or all invalid → run `failed` with `INVALID_ROWS_THRESHOLD` / `ALL_ROWS_INVALID`. Nothing is written: no upserts, no snapshots, no sweep.
- Unknown extra keys are kept in `rawPayload` (admin only).

### 7.3 Derived fields
- `rankingScore = max(0, equity - credit)`; `isFunded = balance !== 0 || equity !== 0`.
- `isTest` = name has the word test/demo, or group environment is `demo`. Set on **first sight only**; admin changes set `isTestSource: "admin"` and are never touched by sync.
- `parsed` from `parseGroup()` (first backslash only; unknown shapes → `"unknown"`). `isHedging` (`-H-`) is **unconfirmed**.
- `rowHash` = SHA-256 of key-sorted JSON (login, email, name, group, 7 money fields). Unchanged → no account write, but `lastSeenAt`, `lastRunId` and a snapshot are still written.
- Leaderboard eligibility (one helper, `getEligibility` / `eligibleFilter` in `fogmApi.ts`): `isActive && !isTest && !adminHidden && rankingScore > 0`. Admin shows the reason: `inactive`, `test_or_hidden`, `not_funded`, `zero_score`. Ranks of accounts that stop being eligible are cleared.

### 7.4 Run telemetry (`fogm_sync_runs`)
`responseCount`, `rowsFetched`, `rowsValid`, `rowsInvalid`, `invalidReasons`, `duplicatesInResponse`, `countMismatch`, `truncatedSuspected`, `feedScope`, `warnings[]`, `warningMessage`. The **/admin** health card shows the latest run's warnings and per-run valid/invalid counts.

### 7.5 Public vs admin
- Public (`/api/leaderboard`, `/api/stats`, `/u/*`, `/api/card/*`): masked name ("Sagar S." / "Anonymous trader" / consented custom name), `••1410`, equity, floating, score. Never email, full login, group, balance, credit or margin fields. Public search matches the displayed name only.
- Admin (`/admin/leaderboard`, CSV export): full row, raw + masked name, parsed group, all money fields (margin level only when margin > 0), flags, eligibility reason, UTC times. CSV cells starting with `= + - @` are prefixed with `'`.

### 7.6 After deploying this change
1. Run `pnpm fogm:indexes` (adds the unique partial index on `publicId`).
2. The first sync rewrites every account once (new `rowHash` format) and sets `isFunded`.
3. Accounts auto-flagged as test under the old rule (which also matched "test"/"demo" anywhere in the **email**) keep that flag; review them in `/admin/leaderboard` and unflag if needed.
