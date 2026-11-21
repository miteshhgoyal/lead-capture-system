# Meta setup checklist (manual steps for a human)

Re-verify each step against the current docs: https://developers.facebook.com/docs/instagram-platform

1. **Create the app** at developers.facebook.com (type: Business). Note the App ID and App secret.
2. **Add the Instagram product** and choose **API setup with Instagram login**. Note the Instagram app ID and secret.
3. **App Domains / Website**: `freecourselink.com`. Add the site URL.
4. **OAuth redirect URI** (Instagram login settings): `https://freecourselink.com/api/autodm/oauth/callback`.
5. **Webhooks** (Instagram): callback URL `https://freecourselink.com/api/webhooks/meta`, verify token = `META_WEBHOOK_VERIFY_TOKEN`. Subscribe to: `comments`, `messages`, `messaging_postbacks` (and `message_reactions`, `messaging_seen` if wanted). The app also subscribes each connected account on connect.
6. **Deauthorize callback URL**: `https://freecourselink.com/api/autodm/meta/deauthorize`. **Data deletion request URL**: `https://freecourselink.com/api/autodm/meta/data-deletion` (it returns the `{url, confirmation_code}` Meta requires).
7. **Public URLs** (app settings): Privacy Policy `https://freecourselink.com/privacy`, Terms `https://freecourselink.com/terms`, Data deletion instructions `https://freecourselink.com/data-deletion`. Add the contact email.
8. **Roles**: add Instagram testers / app testers. Each tester's Instagram account must be **Professional** and must accept the invitation (Instagram > Settings > Apps and websites > Tester invites).
9. **Permissions** to request: `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments` (confirm exact names and whether `instagram_business_content_publish` is NOT needed).
10. **Business Verification** and **App Review / Advanced Access** are required before non-testers can connect. See `APP_REVIEW_KIT.md`.
11. Fill the envs (`ENV.md`), deploy, schedule the cron (`README.md`), then in **Admin > AutoDM** check Readiness is green and turn the master switch on.
12. Facebook Messenger (optional, later): add the Messenger product, request `pages_*` permissions, set `FACEBOOK_REDIRECT_URI`, then enable **Facebook Messenger** in the admin toggles.
