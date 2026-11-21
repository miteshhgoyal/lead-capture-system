import type { NormalizedEvent, Platform } from "./types";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function ts(v: unknown, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n < 1e12 ? n * 1000 : n; // seconds -> ms
}

/**
 * Turns a Meta webhook body into zero or more normalised events.
 * Echoes (messages sent by the account) and events authored by the account itself are returned as kind "ignored",
 * which is what prevents self-reply loops. Reads/deliveries/reactions are ignored too.
 */
export function normalizePayload(body: unknown, now: number = Date.now()): NormalizedEvent[] {
  const root = obj(body);
  const object = str(root.object);
  const platform: Platform | null = object === "instagram" ? "instagram" : object === "page" ? "facebook" : null;
  if (!platform) return [];
  const out: NormalizedEvent[] = [];

  for (const entryRaw of arr(root.entry)) {
    const entry = obj(entryRaw);
    const accountId = str(entry.id);
    if (!accountId) continue;
    const entryTime = ts(entry.time, now);

    // Comments (Instagram `comments`, Facebook `feed`)
    for (const chRaw of arr(entry.changes)) {
      const ch = obj(chRaw);
      const field = str(ch.field);
      const v = obj(ch.value);
      if (platform === "instagram" && field === "comments") {
        const from = obj(v.from);
        const commentId = str(v.id);
        const actorId = str(from.id);
        const base = { platform, accountExternalId: accountId, actorId, actorUsername: str(from.username) || undefined, text: str(v.text), commentId, parentCommentId: str(v.parent_id) || undefined, mediaId: str(obj(v.media).id) || undefined, timestamp: entryTime, externalEventId: commentId } as const;
        if (!commentId || !actorId) out.push({ ...base, kind: "ignored", externalEventId: commentId || `c:${accountId}:${entryTime}`, ignoreReason: "missing_ids" });
        else if (actorId === accountId) out.push({ ...base, kind: "ignored", ignoreReason: "self_authored" });
        else out.push({ ...base, kind: "comment" });
      } else if (platform === "facebook" && field === "feed" && str(v.item) === "comment") {
        const from = obj(v.from);
        const commentId = str(v.comment_id);
        const actorId = str(from.id);
        const base = { platform, accountExternalId: accountId, actorId, actorUsername: str(from.name) || undefined, text: str(v.message), commentId, parentCommentId: str(v.parent_id) !== str(v.post_id) ? str(v.parent_id) || undefined : undefined, mediaId: str(v.post_id) || undefined, timestamp: ts(v.created_time, entryTime), externalEventId: commentId } as const;
        if (str(v.verb) !== "add" || !commentId || !actorId) out.push({ ...base, kind: "ignored", externalEventId: commentId || `c:${accountId}:${entryTime}`, ignoreReason: "not_a_new_comment" });
        else if (actorId === accountId) out.push({ ...base, kind: "ignored", ignoreReason: "self_authored" });
        else out.push({ ...base, kind: "comment" });
      }
    }

    // Messaging (DMs, story replies/mentions, postbacks, echoes, reads)
    for (const mRaw of arr(entry.messaging)) {
      const m = obj(mRaw);
      const sender = str(obj(m.sender).id);
      const recipient = str(obj(m.recipient).id);
      const time = ts(m.timestamp, entryTime);
      const message = obj(m.message);
      const postback = obj(m.postback);
      const base = { platform, accountExternalId: accountId, actorId: sender, timestamp: time } as const;

      if (m.read || m.delivery || m.reaction) {
        out.push({ ...base, kind: "ignored", text: "", externalEventId: `r:${accountId}:${sender}:${time}`, ignoreReason: "receipt_or_reaction" });
      } else if (message.is_echo === true || sender === accountId || (recipient && recipient !== accountId && !sender)) {
        out.push({ ...base, kind: "ignored", text: str(message.text), externalEventId: str(message.mid) || `e:${accountId}:${time}`, messageId: str(message.mid) || undefined, ignoreReason: message.is_echo === true ? "echo" : "self_authored" });
      } else if (postback.payload !== undefined || postback.title !== undefined) {
        const id = str(postback.mid) || `pb:${accountId}:${sender}:${time}`;
        out.push({ ...base, kind: "postback", text: str(postback.title), payload: str(postback.payload), messageId: id, externalEventId: id });
      } else if (message.mid !== undefined || message.text !== undefined || message.attachments !== undefined) {
        const mid = str(message.mid) || `m:${accountId}:${sender}:${time}`;
        const attachments = arr(message.attachments).map(obj);
        const story = obj(obj(message.reply_to).story);
        const mention = attachments.find((a) => str(a.type) === "story_mention");
        const common = { ...base, text: str(message.text), messageId: mid, externalEventId: mid } as const;
        if (!sender) out.push({ ...common, kind: "ignored", ignoreReason: "missing_sender" });
        else if (str(story.id) || str(story.url)) out.push({ ...common, kind: "story_reply", storyId: str(story.id) || undefined });
        else if (mention) out.push({ ...common, kind: "story_mention", storyId: str(obj(mention.payload).id) || undefined });
        else out.push({ ...common, kind: "dm" });
      }
    }
  }
  return out;
}
