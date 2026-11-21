export type Platform = "instagram" | "facebook";
export type TriggerType = "comment" | "story_reply" | "story_mention" | "dm_keyword" | "dm_default";
export type MatchType = "contains" | "exact" | "any";

/** One internal event shape, whatever Meta sent. */
export interface NormalizedEvent {
  platform: Platform;
  kind: "comment" | "story_reply" | "story_mention" | "dm" | "postback" | "ignored";
  /** The connected account's id as Meta reports it (entry.id). */
  accountExternalId: string;
  /** Person who acted (commenter / sender). */
  actorId: string;
  actorUsername?: string;
  text: string;
  commentId?: string;
  parentCommentId?: string;
  mediaId?: string;
  messageId?: string;
  storyId?: string;
  payload?: string;
  /** Unix ms. */
  timestamp: number;
  /** Stable id of the thing that happened (comment id, message id...). Used for dedupe. */
  externalEventId: string;
  ignoreReason?: string;
}

export interface AutomationLike {
  id: string;
  accountId: string;
  status: string;
  triggerType: TriggerType;
  mediaId?: string | null;
  keywordList: string[];
  matchType: MatchType;
  caseSensitive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
}
