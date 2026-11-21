/**
 * AutoDM simulator: posts a SIGNED fake Instagram comment webhook into the local app so the whole flow
 * (webhook -> queue -> automation -> mock DM -> lead -> analytics) can be demoed with zero Meta access.
 *
 *   1. .env: AUTODM_MOCK_META=true, META_APP_SECRET=anything, APP_ENCRYPTION_KEY=<64 hex>, ADMIN_* as usual
 *   2. Admin > AutoDM > turn on the master switch (use the developer override in dev)
 *   3. Partner portal > AutoDM > Connect Instagram (creates a mock account) > create + activate an automation
 *   4. pnpm tsx --env-file=.env scripts/autodm-simulate-comment.ts --account <instagram id shown in the logs/admin> --text "GUIDE"
 *
 * Options: --url http://localhost:3000  --account <external id>  --user <commenter id>  --username <name>
 *          --media <media id>  --text <comment text>  --comment <comment id>  --repeat 2 (sends the same webhook twice to prove dedupe)
 */
import { createHmac } from "node:crypto";

const arg = (name: string, fallback = ""): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? (process.argv[i + 1] ?? fallback) : fallback;
};

const base = arg("url", "http://localhost:3000").replace(/\/+$/, "");
const account = arg("account");
const secret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
if (!account) {
  console.error("Missing --account <the connected account's Instagram id>");
  process.exit(1);
}
if (!secret) {
  console.error("Set META_APP_SECRET (any value in mock mode) in .env so the webhook can be signed.");
  process.exit(1);
}

const commentId = arg("comment", `sim_comment_${Date.now()}`);
const body = JSON.stringify({
  object: "instagram",
  entry: [
    {
      id: account,
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: "comments",
          value: {
            id: commentId,
            text: arg("text", "GUIDE"),
            from: { id: arg("user", "17841499999999999"), username: arg("username", "sim_commenter") },
            media: { id: arg("media", `${account}_media_1`), media_product_type: "REELS" },
          },
        },
      ],
    },
  ],
});
const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

async function main() {
  const times = Math.max(1, Number(arg("repeat", "1")));
  for (let i = 0; i < times; i++) {
    const res = await fetch(`${base}/api/webhooks/meta`, { method: "POST", headers: { "Content-Type": "application/json", "X-Hub-Signature-256": signature }, body });
    console.log(`#${i + 1} ${res.status} ${await res.text()}`);
  }
  console.log(`Comment id: ${commentId}. Check Admin > AutoDM > Logs and the partner's Conversations/Leads/Analytics.`);
}
void main();
