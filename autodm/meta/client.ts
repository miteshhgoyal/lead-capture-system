import type { Platform } from "../types";
import type { ComposedDm } from "../composer";

export interface ConnectResult {
  /** Long-lived user token (Instagram) or page token (Facebook). */
  accessToken: string;
  expiresInSec?: number;
  /** Instagram user id / Facebook page id when the exchange already knows it. */
  accountIdHint?: string;
}

export interface MetaProfile {
  externalId: string;
  username: string;
  displayName?: string;
  pictureUrl?: string;
  /** BUSINESS / MEDIA_CREATOR for Instagram Professional accounts, PAGE for Facebook. */
  accountType: string;
  isProfessional: boolean;
}

export interface MediaItem {
  id: string;
  caption?: string;
  mediaType?: string;
  thumbnailUrl?: string;
  permalink?: string;
  timestamp?: string;
}

export interface SendResult {
  messageId: string;
}

/**
 * Everything AutoDM needs from Meta. The real implementation (GraphApiMetaClient) talks to the Graph API,
 * FakeMetaClient answers locally. The Facebook-Login path for Instagram can be added as another implementation.
 */
export interface MetaClient {
  buildAuthorizeUrl(platform: Platform, state: string): string;
  exchangeCode(platform: Platform, code: string): Promise<ConnectResult>;
  refreshToken(platform: Platform, token: string): Promise<{ accessToken: string; expiresInSec?: number }>;
  getProfile(platform: Platform, token: string, accountIdHint?: string): Promise<MetaProfile>;
  listMedia(platform: Platform, token: string, accountId: string, opts?: { after?: string; limit?: number }): Promise<{ items: MediaItem[]; next?: string }>;
  subscribeWebhooks(platform: Platform, token: string, accountId: string): Promise<void>;
  unsubscribeWebhooks(platform: Platform, token: string, accountId: string): Promise<void>;
  /** Private Reply to a comment: `recipient: { comment_id }`. One per comment, within 7 days. */
  sendPrivateReply(platform: Platform, token: string, accountId: string, commentId: string, dm: ComposedDm): Promise<SendResult>;
  /** Standard DM reply: `recipient: { id }`. Only inside the 24h window (7 days with the Human Agent tag). */
  sendDm(platform: Platform, token: string, accountId: string, userId: string, dm: ComposedDm, opts?: { humanAgent?: boolean }): Promise<SendResult>;
  replyToComment(platform: Platform, token: string, commentId: string, text: string): Promise<SendResult>;
  getUserProfile(platform: Platform, token: string, userId: string): Promise<{ username?: string; name?: string }>;
}
