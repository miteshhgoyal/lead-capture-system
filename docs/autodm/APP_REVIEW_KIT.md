# App Review kit

**Only Instagram Professional (Business or Creator) accounts are supported.** State this in the submission notes.

Re-verify permission names, what each unlocks and the current review requirements in the Meta docs before submitting.

## Permissions and why

| Permission | Why we need it | Screen that uses it |
|---|---|---|
| `instagram_business_basic` | Read the connected account's id, username, name, picture and account type (to verify it is Professional) and list media so the user can pick a post/reel | Partner portal > AutoDM (account cards), New automation > step "Post" |
| `instagram_business_manage_comments` | Receive comment webhooks on the user's posts and post an optional public reply under a matched comment | New automation (comment trigger, public reply), Conversations |
| `instagram_business_manage_messages` | Send the private reply / DM that the user configured, **only** in response to a comment, story reply/mention or message from that person | New automation > Message, Conversations, Leads |

We never message people who did not interact first, we send one private reply per comment (within 7 days) and DMs only within 24 hours of the person's last message.

## Screencast script (about 3 minutes, one take)

1. Show the public Privacy Policy, Terms and Data deletion pages (footer links).
2. Sign in to the partner portal > **AutoDM**. Show the explanation of the rules (Professional account, interaction first, 7 days / 24 hours).
3. Click **Connect Instagram**: show the Instagram consent screen listing the three permissions, approve. Show the connected account card.
4. **New automation**: pick the account, trigger "Comment on a post/reel", choose a reel, keyword `GUIDE`, write the DM with a button, add a public reply, review, **Activate**.
5. From a second (tester) Instagram account, comment `GUIDE` on that reel. Show the DM arriving (private reply) and the public reply.
6. Back in the portal: **Conversations** (thread shows what was received/sent), **Leads** (the commenter appears), **Analytics** (sent count and link clicks).
7. Reply to the DM, then show a plain DM reply working inside the 24 h window (optional).
8. **Disconnect** the account. Show that automations pause. Show the data deletion page and explain the automatic deletion callback.

## Test-user instructions for reviewers

* Test login: create a Partner account at `/partner/join`, or use the credentials we supply in the submission form.
* The app's tester Instagram Professional account is added under App Roles. Comment `GUIDE` on the latest reel of the connected account.
* The master switch and per-feature toggles are admin-only; the review environment is pre-configured with AutoDM on.

## Notes for the submission form

* Data use: replies are sent only as a direct response to an inbound event; message text is retained 180 days and raw webhook payloads 30 days (configurable); deletion callbacks are implemented.
* Rate limiting: per-account throttling, daily cap, exponential backoff.
