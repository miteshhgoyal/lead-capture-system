# AutoDM (Instagram / Facebook comment and DM automation)

Partners connect their own Instagram **Professional** account (Facebook Page behind a flag), create automations
("when someone comments GUIDE on this reel, send them a DM with a link"), and see leads, conversations and analytics.
Everything uses Meta's **official** Instagram Platform / Graph API. There is no scraping and no cold or bulk messaging.

## Where things live

| Area | Location |
|---|---|
| Module code (logic, models, API handlers, UI components) | `autodm/` |
| Thin Next.js route files (re-export into the module) | `app/api/autodm/[[...path]]`, `app/api/admin/autodm/[[...path]]`, `app/api/webhooks/meta`, `app/autodm/**`, `app/admin/autodm` |
| Public legal pages (always reachable) | `app/privacy`, `app/terms`, `app/data-deletion`, `app/contact`, `app/autodm/data-deletion-status/[code]` |
| Tests | `__tests__/autodm/` (run with `pnpm test` or `node __tests__/autodm/run-tests.mjs`) |
| Simulator | `scripts/autodm-simulate-comment.ts` |
| Collections | all prefixed `autodm_` (MongoDB creates them and their indexes lazily, so there are **no migrations**) |

**Users are partners.** This project has no end-user accounts: the people who connect Instagram are Partner Program members, signed in
with the partner portal session. The admin manages everything from **Admin > AutoDM**.

## Flow

```
Partner portal                       Meta                                  This app
--------------                       ----                                  --------
Connect Instagram ----------------> OAuth consent
                                    redirect + code -------------------->  /api/autodm/oauth/callback
                                                                           validate single-use state, exchange code,
                                                                           encrypt token (AES-256-GCM), check Professional,
                                                                           subscribe webhooks, upsert account

Someone comments / replies / DMs -> POST /api/webhooks/meta ------------>  verify X-Hub-Signature-256 on the RAW body
                                                                           normalise -> store event (dedupe key) -> enqueue
                                                                           answer 200 immediately
                                                                           next/server after(): drain the queue
                                                                           processEvent: look up the account in OUR db,
                                                                             feature flags, match ONE automation
                                                                           executeRun: guards (flags, account, sending flag,
                                                                             daily cap, once-per-user, 7d/24h window)
                                    <---- private reply / DM ------------   send via MetaClient (real or fake)
                                                                           run + message + lead + counters recorded
```

### Queue and scheduler (no Redis, no worker process)

The project has no Redis or worker, so AutoDM uses a small **MongoDB-backed queue** (`autodm_jobs`, atomic claim, retries with
exponential backoff + jitter). Jobs are drained

1. right after each webhook response with `after()` (so the webhook itself stays fast), and
2. by **`/api/autodm/cron`** which you call every minute from any scheduler:

```
curl -fsS -X POST https://freecourselink.com/api/autodm/cron -H "Authorization: Bearer $AUTODM_CRON_SECRET"
```

The cron call retries delayed jobs, deletion requests, refreshes tokens expiring within 10 days (checked every 6 h), and applies
retention (daily). With the master switch off, token refresh and retention no-op and AutoDM jobs are acknowledged and discarded.
You can also press **Admin > AutoDM > Danger zone > Run now**.

### Safety rules enforced in code

* A send only ever happens as a reaction to a stored inbound event (`actionFor()` maps comment / story reply / story mention / DM to a send action; nothing else does).
* Private reply: one per comment (unique run key), within 7 days. DM: within 24 h of the person's last message (7 days only when the admin enables the Human Agent tag).
* Once per person per automation by default. Daily cap per account. Per-account throttle plus global backoff when Meta rate-limits.
* Echoes and events authored by the connected account are ignored (no self-reply loops).
* Three idempotency layers: webhook dedupe key, unique run key `(automation, trigger, action)`, once-per-user rule.

## Flags

All flags live in `autodm_settings` (editable in Admin > AutoDM), are read at request/job time (5 s cache, dropped on write) and are
audit-logged to `autodm_audit_logs`. `autodm.enabled` is **off by default** and cannot be turned on while required envs are missing
(non-production developer override only). See `autodm/settings-defs.ts` for the full list and `RUNBOOK.md` for what each does.

## Core files touched

`components/partner/PartnerShell.tsx` (optional AutoDM nav item), `app/partner/portal/layout.tsx` (passes the flag), `components/admin/AdminShell.tsx`
(nav item), `lib/validation/partner.ts` (reserved slugs `autodm`, `data-deletion`), `app/robots.ts` (disallow `/autodm/`), `.env.example` (AutoDM block).
Removing the module = delete `autodm/`, the route files listed above, and revert those five edits.

## Testing and the simulator

```
pnpm test                                    # whole project (tsx --test)
node __tests__/autodm/run-tests.mjs          # AutoDM unit tests only, no build step
```

Simulator (no Meta access needed):

1. `.env`: `AUTODM_MOCK_META=true`, `APP_ENCRYPTION_KEY=$(openssl rand -hex 32)`, `META_APP_SECRET=anything`. Run `pnpm dev` (mock mode is ignored in production builds).
2. Admin > AutoDM > Feature toggles > master switch (use **Developer override** in dev).
3. Sign in as a partner > AutoDM > **Connect Instagram** (creates a fake account) > New automation (comment trigger, keyword `GUIDE`) > Activate.
4. `pnpm tsx --env-file=.env scripts/autodm-simulate-comment.ts --account <the fake account's Instagram id> --text "GUIDE" --repeat 2`
   (the id is shown in Admin > AutoDM > Logs > Webhook events after the first run, or in the `autodm_connected_accounts` collection).
5. Check Conversations, Leads, Analytics and Admin > Logs. `--repeat 2` proves duplicate deliveries create one DM.
