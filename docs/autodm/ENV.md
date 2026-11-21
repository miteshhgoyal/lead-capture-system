# AutoDM environment variables

All AutoDM envs are read in one place: `autodm/config.ts`. **Every one may be empty**: the app boots and runs without them, and
Admin > AutoDM > Readiness shows what is missing (names only, never values). Existing project envs (`MONGODB_URI`, `NEXT_PUBLIC_SITE_URL`,
`ADMIN_SESSION_SECRET`) are reused.

| Variable | Required to enable | What / where to get it | Example |
|---|---|---|---|
| `META_APP_ID` | yes (or `INSTAGRAM_APP_ID`) | Meta app dashboard > App settings > Basic > App ID | `1234567890` |
| `META_APP_SECRET` | yes (or `INSTAGRAM_APP_SECRET`) | App settings > Basic > App secret. Signs webhooks and `signed_request` | |
| `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET` | alternative | Instagram product > "API setup with Instagram login" > Instagram app ID/secret. Used first when set | |
| `META_WEBHOOK_VERIFY_TOKEN` | yes | Any random string you choose; paste the same value into the webhook config | `openssl rand -hex 16` |
| `META_GRAPH_API_VERSION` | no | Graph version to call. Empty = `v23.0` default in `config.ts` (**re-verify**) | `v23.0` |
| `META_INSTAGRAM_SCOPES` | no | Permissions requested at login (defaults set) | `instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments` |
| `META_FACEBOOK_SCOPES` | Facebook only | Permissions for the Facebook Page path | `pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement` |
| `INSTAGRAM_REDIRECT_URI` | yes | Must match the OAuth redirect URI in the Meta dashboard exactly | `https://freecourselink.com/api/autodm/oauth/callback` |
| `FACEBOOK_REDIRECT_URI` | Facebook only | Same, for Facebook Login | same URL |
| `META_WEBHOOK_URL` | no (reference) | Callback URL to paste in Webhooks | `https://freecourselink.com/api/webhooks/meta` |
| `META_DEAUTHORIZE_URL` | no (reference) | Deauthorize callback to paste in app settings | `.../api/autodm/meta/deauthorize` |
| `META_DATA_DELETION_URL` | no (reference) | Data deletion request URL | `.../api/autodm/meta/data-deletion` |
| `APP_ENCRYPTION_KEY` | yes | 32 random bytes as **64 hex chars**. Encrypts tokens (AES-256-GCM). Losing it makes stored tokens unreadable (users must reconnect) | `openssl rand -hex 32` |
| `AUTODM_QUEUE_NAME` | no | Queue namespace in `autodm_jobs` | `autodm` |
| `AUTODM_MOCK_META` | no | `true` = fake Meta client for dev/tests. **Ignored when `NODE_ENV=production`** | `false` |
| `AUTODM_CRON_SECRET` | for the scheduler | Bearer secret for `/api/autodm/cron` | `openssl rand -hex 24` |
| `NEXT_PUBLIC_SITE_URL` | yes | Public https origin; used for tracked links and the data-deletion status URL | `https://freecourselink.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Shown on `/contact` | |

Required set when `AUTODM_MOCK_META=true`: `MONGODB_URI`, `APP_ENCRYPTION_KEY` and one app secret (to sign simulated webhooks).
There are no Redis envs: the queue is MongoDB-backed.
