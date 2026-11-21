import { config, INSTAGRAM_WEBHOOK_FIELDS, FACEBOOK_WEBHOOK_FIELDS } from "../config";
import type { Platform } from "../types";
import type { ComposedDm } from "../composer";
import { MetaError, mapGraphError } from "../errors";
import type { ConnectResult, MediaItem, MetaClient, MetaProfile, SendResult } from "./client";

/**
 * Real Graph API client. All hosts, paths and field names below follow the Instagram Platform docs as remembered
 * and MUST be re-verified before launch (see config.ts for the doc links). Tokens are sent in the Authorization
 * header, never in a URL, so they cannot leak through access logs or error messages.
 */
const IG_GRAPH = "https://graph.instagram.com";
const FB_GRAPH = "https://graph.facebook.com";
const TIMEOUT_MS = 10_000;

async function call(url: string, init: RequestInit & { token?: string; form?: Record<string, string> } = {}): Promise<Record<string, unknown>> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  let body = init.body;
  if (init.form) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    body = new URLSearchParams(init.form).toString();
  }
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, body, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  } catch {
    throw new MetaError("transient", "Network error talking to Meta");
  }
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON body */
  }
  if (!res.ok || (data && typeof data === "object" && "error" in (data as object))) throw mapGraphError(res.status, data);
  return data as Record<string, unknown>;
}

const s = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

export class GraphApiMetaClient implements MetaClient {
  private get c() {
    return config();
  }
  private base(platform: Platform) {
    return platform === "instagram" ? `${IG_GRAPH}/${this.c.graphVersion}` : `${FB_GRAPH}/${this.c.graphVersion}`;
  }

  buildAuthorizeUrl(platform: Platform, state: string): string {
    const c = this.c;
    if (platform === "instagram") {
      const q = new URLSearchParams({ client_id: c.instagramAppId || c.appId, redirect_uri: c.instagramRedirectUri, response_type: "code", scope: c.instagramScopes.join(","), state });
      return `https://www.instagram.com/oauth/authorize?${q}`;
    }
    const q = new URLSearchParams({ client_id: c.appId, redirect_uri: c.facebookRedirectUri, response_type: "code", scope: c.facebookScopes.join(","), state });
    return `https://www.facebook.com/${c.graphVersion}/dialog/oauth?${q}`;
  }

  async exchangeCode(platform: Platform, code: string): Promise<ConnectResult> {
    const c = this.c;
    if (platform === "instagram") {
      const id = c.instagramAppId || c.appId;
      const secret = c.instagramAppSecret || c.appSecret;
      const short = await call("https://api.instagram.com/oauth/access_token", { method: "POST", form: { client_id: id, client_secret: secret, grant_type: "authorization_code", redirect_uri: c.instagramRedirectUri, code } });
      const shortToken = s(short.access_token) || s((short.data as { access_token?: string }[] | undefined)?.[0]?.access_token);
      const userId = s(short.user_id) || s((short.data as { user_id?: string }[] | undefined)?.[0]?.user_id);
      if (!shortToken) throw new MetaError("unknown", "Instagram did not return an access token");
      const long = await call(`${IG_GRAPH}/access_token?${new URLSearchParams({ grant_type: "ig_exchange_token", client_secret: secret })}`, { token: shortToken });
      return { accessToken: s(long.access_token) || shortToken, expiresInSec: Number(long.expires_in) || undefined, accountIdHint: userId || undefined };
    }
    // Facebook: code -> user token -> long-lived user token -> first managed Page (page token does not expire).
    const tok = await call(`${this.base("facebook")}/oauth/access_token?${new URLSearchParams({ client_id: c.appId, client_secret: c.appSecret, redirect_uri: c.facebookRedirectUri, code })}`);
    const long = await call(`${this.base("facebook")}/oauth/access_token?${new URLSearchParams({ grant_type: "fb_exchange_token", client_id: c.appId, client_secret: c.appSecret, fb_exchange_token: s(tok.access_token) })}`);
    const pages = await call(`${this.base("facebook")}/me/accounts?fields=id,name,access_token`, { token: s(long.access_token) });
    const page = (pages.data as { id?: string; access_token?: string }[] | undefined)?.[0];
    if (!page?.access_token || !page.id) throw new MetaError("permission_missing", "No Facebook Page was shared with the app");
    return { accessToken: page.access_token, accountIdHint: page.id };
  }

  async refreshToken(platform: Platform, token: string) {
    if (platform === "facebook") return { accessToken: token }; // page tokens from long-lived user tokens do not expire
    const r = await call(`${IG_GRAPH}/refresh_access_token?${new URLSearchParams({ grant_type: "ig_refresh_token" })}`, { token });
    return { accessToken: s(r.access_token) || token, expiresInSec: Number(r.expires_in) || undefined };
  }

  async getProfile(platform: Platform, token: string, accountIdHint?: string): Promise<MetaProfile> {
    if (platform === "instagram") {
      const r = await call(`${this.base("instagram")}/me?fields=user_id,username,name,account_type,profile_picture_url`, { token });
      const type = s(r.account_type).toUpperCase();
      return { externalId: s(r.user_id) || s(r.id) || accountIdHint || "", username: s(r.username), displayName: s(r.name) || undefined, pictureUrl: s(r.profile_picture_url) || undefined, accountType: type || "UNKNOWN", isProfessional: type === "BUSINESS" || type === "MEDIA_CREATOR" };
    }
    const r = await call(`${this.base("facebook")}/${encodeURIComponent(accountIdHint ?? "me")}?fields=id,name,picture{url}`, { token });
    return { externalId: s(r.id), username: s(r.name), displayName: s(r.name), pictureUrl: s(((r.picture as { data?: { url?: string } } | undefined)?.data ?? {}).url) || undefined, accountType: "PAGE", isProfessional: true };
  }

  async listMedia(platform: Platform, token: string, accountId: string, opts: { after?: string; limit?: number } = {}) {
    const q = new URLSearchParams({ limit: String(Math.min(50, opts.limit ?? 24)) });
    if (opts.after) q.set("after", opts.after);
    if (platform === "instagram") {
      q.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
      const r = await call(`${this.base("instagram")}/${encodeURIComponent(accountId)}/media?${q}`, { token });
      return { items: mapMedia(r.data), next: nextCursor(r.paging) };
    }
    q.set("fields", "id,message,full_picture,permalink_url,created_time");
    const r = await call(`${this.base("facebook")}/${encodeURIComponent(accountId)}/posts?${q}`, { token });
    const items: MediaItem[] = ((r.data as Record<string, unknown>[] | undefined) ?? []).map((p) => ({ id: s(p.id), caption: s(p.message), mediaType: "POST", thumbnailUrl: s(p.full_picture) || undefined, permalink: s(p.permalink_url) || undefined, timestamp: s(p.created_time) || undefined }));
    return { items, next: nextCursor(r.paging) };
  }

  async subscribeWebhooks(platform: Platform, token: string, accountId: string) {
    const fields = (platform === "instagram" ? INSTAGRAM_WEBHOOK_FIELDS : FACEBOOK_WEBHOOK_FIELDS).join(",");
    await call(`${this.base(platform)}/${encodeURIComponent(accountId)}/subscribed_apps`, { method: "POST", token, form: { subscribed_fields: fields } });
  }

  async unsubscribeWebhooks(platform: Platform, token: string, accountId: string) {
    await call(`${this.base(platform)}/${encodeURIComponent(accountId)}/subscribed_apps`, { method: "DELETE", token });
  }

  private message(dm: ComposedDm): Record<string, unknown> {
    if (dm.buttons.length === 0) return { text: dm.text };
    return { attachment: { type: "template", payload: { template_type: "button", text: dm.text, buttons: dm.buttons.map((b) => ({ type: "web_url", url: b.url, title: b.label })) } } };
  }

  async sendPrivateReply(platform: Platform, token: string, accountId: string, commentId: string, dm: ComposedDm): Promise<SendResult> {
    const r = await call(`${this.base(platform)}/${encodeURIComponent(accountId)}/messages`, { method: "POST", token, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient: { comment_id: commentId }, message: this.message(dm) }) });
    return { messageId: s(r.message_id) || s(r.id) };
  }

  async sendDm(platform: Platform, token: string, accountId: string, userId: string, dm: ComposedDm, opts: { humanAgent?: boolean } = {}): Promise<SendResult> {
    const body: Record<string, unknown> = { recipient: { id: userId }, message: this.message(dm) };
    if (opts.humanAgent) {
      body.messaging_type = "MESSAGE_TAG";
      body.tag = "HUMAN_AGENT";
    }
    const r = await call(`${this.base(platform)}/${encodeURIComponent(accountId)}/messages`, { method: "POST", token, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { messageId: s(r.message_id) || s(r.id) };
  }

  async replyToComment(platform: Platform, token: string, commentId: string, text: string): Promise<SendResult> {
    const path = platform === "instagram" ? "replies" : "comments";
    const r = await call(`${this.base(platform)}/${encodeURIComponent(commentId)}/${path}`, { method: "POST", token, form: { message: text } });
    return { messageId: s(r.id) };
  }

  async getUserProfile(platform: Platform, token: string, userId: string) {
    const r = await call(`${this.base(platform)}/${encodeURIComponent(userId)}?fields=${platform === "instagram" ? "name,username" : "name"}`, { token });
    return { username: s(r.username) || undefined, name: s(r.name) || undefined };
  }
}

function nextCursor(paging: unknown): string | undefined {
  const p = (paging ?? {}) as { cursors?: { after?: string }; next?: string };
  return p.next && p.cursors?.after ? p.cursors.after : undefined;
}

function mapMedia(data: unknown): MediaItem[] {
  return ((data as Record<string, unknown>[] | undefined) ?? []).map((m) => ({ id: s(m.id), caption: s(m.caption), mediaType: s(m.media_type), thumbnailUrl: s(m.thumbnail_url) || s(m.media_url) || undefined, permalink: s(m.permalink) || undefined, timestamp: s(m.timestamp) || undefined }));
}
