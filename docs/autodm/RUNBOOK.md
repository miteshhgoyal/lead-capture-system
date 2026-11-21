# AutoDM runbook

All controls are in **Admin > AutoDM**. Flags take effect within about 5 seconds, no redeploy.

## Quick actions

| Situation | Action |
|---|---|
| Something is wrong and you want it all stopped | Feature toggles > **AutoDM master switch** OFF. User pages/APIs 404, workers discard AutoDM jobs, the webhook still answers 200 (so Meta keeps the subscription), compliance endpoints keep working, data is preserved |
| Messages must stop but you want to keep recording | **Outbound sending (kill switch)** OFF. Events are recorded, nothing is sent. Runs show `skipped_sending_disabled`. After turning it back on use Logs > **Replay** (only works while still inside the 7-day / 24-hour window) |
| One trigger/platform misbehaves | Turn off that flag (comment / story / DM keyword / Instagram / Facebook / public replies). The matching UI hides and the API answers 403 with a clear message |
| One bad actor | Accounts tab > **Disable** (reversible) or **Force disconnect** |
| Everyone's automations must be reset | Danger zone > **Pause all automations** |
| A partner asks for removal | Danger zone > **Purge AutoDM data** for that partner id |

## Token-expiry spike

Symptoms: many accounts `token_expired`, users report paused automations. Check Readiness > "Tokens expiring soon" and Logs for
`token_invalid`. Causes: the cron is not running (tokens are refreshed when within 10 days of expiry), `APP_ENCRYPTION_KEY` changed
(tokens cannot be decrypted), or users revoked access. Fix: make sure `/api/autodm/cron` is scheduled (or press **Run now**), restore the
key, and ask affected users to reconnect (they get an in-app notice and their automations were paused automatically).

## Meta rate limiting

Symptoms: runs with error `rate_limited`, retries in Logs. The runner backs off per account (global backoff + exponential retry up to 5
attempts) and then marks the run failed. Lower `Daily DM cap per account`, check for a runaway automation (Analytics), and consider turning sending off briefly.

## Webhook failures

* Readiness shows **Last webhook received**. If it is old, check Meta > Webhooks for delivery errors and that the verify token matches.
* `401 Invalid signature`: the app secret in env does not match the app that sends events (set `INSTAGRAM_APP_SECRET` and/or `META_APP_SECRET`; both are accepted).
* Events stuck as `queued` and Queue depth growing: the cron is not running. Run it, or press **Run now**. Jobs that fail 5 times become `dead` (Readiness > Failed jobs).
* Duplicate deliveries are harmless: they are deduplicated.

## Rollback

Turn the master switch off. To remove the module entirely: delete `autodm/`, the route files listed in `README.md`, revert the five core edits,
and optionally drop the `autodm_*` collections. Nothing else depends on it.

## Compliance endpoints (always on)

`POST /api/autodm/meta/deauthorize` revokes the account and deletes its token. `POST /api/autodm/meta/data-deletion` queues deletion and returns
`{url, confirmation_code}`; the status page is `/autodm/data-deletion-status/<code>`. Both verify `signed_request` with the app secret.
