import type { Platform } from "../types";
import type { ComposedDm } from "../composer";
import { MetaError, type MetaErrorKind } from "../errors";
import type { ConnectResult, MediaItem, MetaClient, MetaProfile, SendResult } from "./client";

export interface FakeCall {
  method: string;
  args: unknown[];
}

const g = globalThis as unknown as { _autodmFake?: { calls: FakeCall[]; failNext: MetaErrorKind[]; counter: number } };
const state = (g._autodmFake ??= { calls: [], failNext: [], counter: 0 });

/**
 * Deterministic stand-in for Meta (AUTODM_MOCK_META=true outside production, and in tests).
 * Records every call; `FakeMetaClient.failNext("rate_limited")` makes the next send throw.
 * OAuth: the "code" encodes the account, e.g. `mock:instagram:17841400000000001:demo_creator`.
 */
export class FakeMetaClient implements MetaClient {
  static get calls(): FakeCall[] {
    return state.calls;
  }
  static reset(): void {
    state.calls.length = 0;
    state.failNext.length = 0;
    state.counter = 0;
  }
  static failNext(kind: MetaErrorKind): void {
    state.failNext.push(kind);
  }
  private rec(method: string, ...args: unknown[]) {
    // never record tokens
    state.calls.push({ method, args: args.map((a) => (typeof a === "string" && a.startsWith("mock_token") ? "[token]" : a)) });
  }
  private maybeFail() {
    const k = state.failNext.shift();
    if (k) throw new MetaError(k, `Simulated ${k}`);
  }

  buildAuthorizeUrl(platform: Platform, stateParam: string): string {
    this.rec("buildAuthorizeUrl", platform);
    const id = `17841400${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;
    const q = new URLSearchParams({ code: `mock:${platform}:${id}:demo_${platform}`, state: stateParam });
    return `/api/autodm/oauth/callback?${q}`;
  }
  async exchangeCode(platform: Platform, code: string): Promise<ConnectResult> {
    this.rec("exchangeCode", platform);
    const [, , id] = code.split(":");
    if (!code.startsWith("mock:")) throw new MetaError("unknown", "Invalid mock code");
    return { accessToken: `mock_token_${id}`, expiresInSec: 60 * 24 * 3600, accountIdHint: id };
  }
  async refreshToken(platform: Platform, token: string) {
    this.rec("refreshToken", platform, token);
    this.maybeFail();
    return { accessToken: token, expiresInSec: 60 * 24 * 3600 };
  }
  async getProfile(platform: Platform, token: string, hint?: string): Promise<MetaProfile> {
    this.rec("getProfile", platform, token);
    const id = hint || token.replace("mock_token_", "");
    return { externalId: id, username: `demo_${platform}`, displayName: "Demo Creator", accountType: platform === "instagram" ? "BUSINESS" : "PAGE", isProfessional: true };
  }
  async listMedia(platform: Platform, token: string, accountId: string) {
    this.rec("listMedia", platform, accountId);
    const items: MediaItem[] = [1, 2, 3].map((n) => ({ id: `${accountId}_media_${n}`, caption: `Demo reel #${n}`, mediaType: "VIDEO", permalink: `https://www.instagram.com/reel/demo${n}/`, timestamp: new Date(Date.now() - n * 86400000).toISOString() }));
    return { items };
  }
  async subscribeWebhooks(platform: Platform, token: string, accountId: string) {
    this.rec("subscribeWebhooks", platform, accountId);
  }
  async unsubscribeWebhooks(platform: Platform, token: string, accountId: string) {
    this.rec("unsubscribeWebhooks", platform, accountId);
  }
  async sendPrivateReply(platform: Platform, token: string, accountId: string, commentId: string, dm: ComposedDm): Promise<SendResult> {
    this.rec("sendPrivateReply", platform, accountId, commentId, dm);
    this.maybeFail();
    return { messageId: `mock_mid_${++state.counter}` };
  }
  async sendDm(platform: Platform, token: string, accountId: string, userId: string, dm: ComposedDm, opts?: { humanAgent?: boolean }): Promise<SendResult> {
    this.rec("sendDm", platform, accountId, userId, dm, opts);
    this.maybeFail();
    return { messageId: `mock_mid_${++state.counter}` };
  }
  async replyToComment(platform: Platform, token: string, commentId: string, text: string): Promise<SendResult> {
    this.rec("replyToComment", platform, commentId, text);
    this.maybeFail();
    return { messageId: `mock_reply_${++state.counter}` };
  }
  async getUserProfile(platform: Platform, token: string, userId: string) {
    this.rec("getUserProfile", platform, userId);
    return { username: `user_${userId.slice(-4)}` };
  }
}
