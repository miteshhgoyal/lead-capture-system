# CRM ↔ Telegram bot integration (Next.js)

## How it works

```
Influencer (CRM website)                CRM backend (Next.js)                 Bot service (VPS)            Telegram
        │  "Connect Telegram group"          │                                     │                          │
        ├───────────────────────────────────►│ create one-time token (30 min)      │                          │
        │◄───────────────────────────────────┤ link: t.me/BOT?startgroup=TOKEN&admin=post_messages          │
        │  taps link, picks group ─────────────────────────────────────────────────────────────────────────►│
        │                                                                          │◄── bot added + "/start TOKEN"
        │                                    │◄── POST webhook group_connected ────┤ (checks sender is admin)
        │                                    │ save chat_id on influencer, reply {ok, influencer_name}
        │                                                                          │── "✅ Connected" ───────►│
        │
        │  Company writes message → CRM stores a Broadcast + one Delivery per influencer (status: draft)
        │  CRM calls POST /rewrite with influencer's style → stores preview (status: pending_approval)
        │  Influencer opens dashboard, sees preview: [Approve] [Regenerate] [Reject]
        │  Approve → CRM calls POST /send (request_id = delivery id) ────────────► bot posts to group
        │                                    │ status: sent (store message_id)
```

Design choices:
- **The CRM owns all state** (influencers, styles, drafts, approvals, audit log). The bot is a thin Telegram worker, so there is one source of truth.
- **Nothing is posted without approval**: the bot only has `/send`, and the CRM only calls it after the approve click.
- **`request_id` makes /send idempotent**: if the CRM retries (timeout, double click), the message is not posted twice.
- The bot leaves any group it is added to by a stranger if nobody links it with a CRM token within 10 minutes.

## Bot service setup

Add to `/opt/broadcastbot/.env` (see `.env.example`):

```
BOT_API_KEY=<openssl rand -hex 32>
CRM_WEBHOOK_URL=https://YOUR-CRM/api/telegram/webhook
CRM_WEBHOOK_SECRET=<openssl rand -hex 32>
```

Install and restart:

```
cd /opt/broadcastbot && source venv/bin/activate && pip install -r requirements.txt
systemctl restart broadcastbot && journalctl -u broadcastbot -n 20 --no-pager
```

The API listens on `127.0.0.1:8080`. Put HTTPS in front so the CRM can reach it (never expose plain HTTP with the API key):

```
# Caddy (auto HTTPS). Needs a domain/subdomain pointing at the VPS, e.g. bot.yourdomain.com
bot.yourdomain.com {
    reverse_proxy 127.0.0.1:8080
}
```

## Bot HTTP API (header `X-API-Key: <BOT_API_KEY>` on everything except `/health`)

| Method | Path | Body | Result |
|---|---|---|---|
| GET | `/health` | | `{ok:true}` |
| POST | `/rewrite` | `{text, style}` | `{ok:true, text}` (502 `rewrite_failed` if Gemini fails) |
| POST | `/send` | `{chat_id, text, request_id}` | `{ok:true, message_id}`; errors: 404 `unknown_group`, 403 `bot_removed_or_blocked` |
| GET | `/groups/{chat_id}` | | `{ok:true, title, members, status, can_post}` |
| POST | `/groups/{chat_id}/leave` | | `{ok:true}` |

## Webhooks the bot sends to the CRM (header `X-Signature: sha256=<hmac>` over the raw body)

Body: `{ "event": "...", "data": {...}, "ts": 1700000000 }`

| event | data | CRM should |
|---|---|---|
| `group_connected` | `token, chat_id, title, telegram_user_id, telegram_username` | validate token (exists, unused, not expired), save `chat_id`, mark token used, reply `{ok:true, influencer_name}` or `{ok:false}` |
| `group_removed` | `chat_id, title` | mark the group disconnected, notify the influencer |
| `group_migrated` | `old_chat_id, new_chat_id` | replace the stored chat id |

## Next.js code

Env in the CRM: `BOT_API_URL=https://bot.yourdomain.com`, `BOT_API_KEY`, `BOT_USERNAME=broadcast_fclbot`, `CRM_WEBHOOK_SECRET`.

### `lib/bot.ts`

```ts
const BASE = process.env.BOT_API_URL!;
const KEY = process.env.BOT_API_KEY!;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-API-Key": KEY, ...(init?.headers || {}) },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw Object.assign(new Error(json.error || `bot_${res.status}`), { status: res.status });
  return json as T;
}

export const rewrite = (text: string, style: string) =>
  call<{ text: string }>("/rewrite", { method: "POST", body: JSON.stringify({ text, style }) });

export const sendToGroup = (chatId: string, text: string, requestId: string) =>
  call<{ message_id: number }>("/send", {
    method: "POST",
    body: JSON.stringify({ chat_id: chatId, text, request_id: requestId }),
  });

export const groupInfo = (chatId: string) =>
  call<{ title: string; members: number; status: string; can_post: boolean }>(`/groups/${chatId}`);
```

### Connect link: `app/api/telegram/connect/route.ts`

```ts
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
// import { db } from "@/lib/db"; import { getInfluencer } from "@/lib/auth";

export async function POST() {
  const influencer = await getInfluencer();            // your session/auth
  const token = randomBytes(32).toString("base64url");  // 43 chars, valid for Telegram deep links
  await db.connectToken.create({
    data: { token, influencerId: influencer.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
  });
  const url = `https://t.me/${process.env.BOT_USERNAME}?startgroup=${token}&admin=post_messages`;
  return NextResponse.json({ url });
}
```

### Webhook receiver: `app/api/telegram/webhook/route.ts`

```ts
import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = (req.headers.get("x-signature") || "").replace("sha256=", "");
  const expected = createHmac("sha256", process.env.CRM_WEBHOOK_SECRET!).update(raw).digest("hex");
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false }, { status: 401 });

  const { event, data, ts } = JSON.parse(raw);
  if (Math.abs(Date.now() / 1000 - ts) > 300) return NextResponse.json({ ok: false }, { status: 400 }); // replay guard

  if (event === "group_connected") {
    const t = await db.connectToken.findUnique({ where: { token: data.token }, include: { influencer: true } });
    if (!t || t.usedAt || t.expiresAt < new Date()) return NextResponse.json({ ok: false, error: "invalid_token" });
    await db.$transaction([
      db.connectToken.update({ where: { token: t.token }, data: { usedAt: new Date() } }),
      db.telegramGroup.upsert({
        where: { chatId: String(data.chat_id) },
        create: { chatId: String(data.chat_id), title: data.title, influencerId: t.influencerId },
        update: { title: data.title, influencerId: t.influencerId, active: true },
      }),
    ]);
    return NextResponse.json({ ok: true, influencer_name: t.influencer.name });
  }
  if (event === "group_removed")
    await db.telegramGroup.updateMany({ where: { chatId: String(data.chat_id) }, data: { active: false } });
  if (event === "group_migrated")
    await db.telegramGroup.updateMany({
      where: { chatId: String(data.old_chat_id) },
      data: { chatId: String(data.new_chat_id) },
    });
  return NextResponse.json({ ok: true });
}
```

### Company creates a broadcast (fan-out previews): `app/api/broadcasts/route.ts`

```ts
import { rewrite } from "@/lib/bot";

export async function POST(req: Request) {
  const { text } = await req.json();                       // company staff only
  const b = await db.broadcast.create({ data: { text } });
  const groups = await db.telegramGroup.findMany({ where: { active: true }, include: { influencer: true } });
  for (const g of groups) {
    const d = await db.delivery.create({
      data: { broadcastId: b.id, groupId: g.id, style: g.influencer.style, status: "generating" },
    });
    try {
      const r = await rewrite(text, g.influencer.style);
      await db.delivery.update({ where: { id: d.id }, data: { preview: r.text, status: "pending_approval" } });
    } catch {
      await db.delivery.update({ where: { id: d.id }, data: { status: "failed" } });
    }
  }
  return Response.json({ id: b.id });
}
```

Gemini free tier has per-minute limits. For many influencers, run this in a queue/background job with a small delay between calls instead of one request.

### Approve / regenerate / reject: `app/api/deliveries/[id]/[action]/route.ts`

```ts
import { rewrite, sendToGroup } from "@/lib/bot";

export async function POST(_: Request, { params }: { params: { id: string; action: string } }) {
  const influencer = await getInfluencer();
  const d = await db.delivery.findFirst({
    where: { id: params.id, group: { influencerId: influencer.id } },   // ownership check
    include: { broadcast: true, group: true },
  });
  if (!d) return Response.json({ ok: false }, { status: 404 });
  if (d.status !== "pending_approval") return Response.json({ ok: false, error: "not_pending" }, { status: 409 });

  if (params.action === "regenerate") {
    const r = await rewrite(d.broadcast.text, influencer.style);
    await db.delivery.update({ where: { id: d.id }, data: { preview: r.text } });
    return Response.json({ ok: true, preview: r.text });
  }
  if (params.action === "reject") {
    await db.delivery.update({ where: { id: d.id }, data: { status: "rejected" } });
    return Response.json({ ok: true });
  }
  if (params.action === "approve") {
    // claim it first so a double click cannot send twice; request_id also protects on the bot side
    const claimed = await db.delivery.updateMany({
      where: { id: d.id, status: "pending_approval" }, data: { status: "sending", approvedAt: new Date() },
    });
    if (claimed.count === 0) return Response.json({ ok: false }, { status: 409 });
    try {
      const sent = await sendToGroup(d.group.chatId, d.preview!, d.id);
      await db.delivery.update({ where: { id: d.id }, data: { status: "sent", telegramMessageId: sent.message_id, sentAt: new Date() } });
      return Response.json({ ok: true });
    } catch (e: any) {
      await db.delivery.update({ where: { id: d.id }, data: { status: "failed", error: String(e.message) } });
      return Response.json({ ok: false, error: e.message }, { status: 502 });
    }
  }
  return Response.json({ ok: false }, { status: 404 });
}
```

The approved text is exactly `d.preview` stored in your database. The influencer cannot send anything different from what they saw.

### Suggested tables (Prisma-style)

```
Influencer     id, name, style (text, default "Hinglish casual")
TelegramGroup  id, chatId (unique), title, influencerId, active
ConnectToken   token (unique), influencerId, expiresAt, usedAt
Broadcast      id, text, createdBy, createdAt
Delivery       id, broadcastId, groupId, style, preview, status
               (generating | pending_approval | sending | sent | rejected | failed | expired),
               approvedAt, sentAt, telegramMessageId, error
```

Dashboard UI needs: a "Connect Telegram group" button (calls `/connect`, opens the returned URL), a style picker (preset list + short custom text, max ~300 chars), a list of pending deliveries showing the preview with Approve / Regenerate / Reject, and the status of past deliveries. Add an expiry job that marks old `pending_approval` deliveries as `expired` (for example after 24h) so stale messages are not approved days later.

## Test checklist

1. `curl https://bot.yourdomain.com/health` returns `{"ok":true}`.
2. `curl -X POST .../rewrite -H "X-API-Key: ..." -H "Content-Type: application/json" -d '{"text":"Hey everyone, let us start trade","style":"Hinglish casual"}'`.
3. Click Connect in the CRM, tap the link with a test group, confirm the bot replies "Connected" and the group appears in the CRM.
4. Create a broadcast, approve it as the test influencer, confirm the message lands once, and that clicking Approve twice does not post twice.
5. Remove the bot from the group and confirm the CRM marks the group disconnected.
