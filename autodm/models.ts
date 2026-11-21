import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * All AutoDM collections. Every collection is prefixed `autodm_`, so removing the module is
 * `db.getCollectionNames().filter(n => n.startsWith("autodm_")).forEach(drop)`. MongoDB creates collections and
 * indexes lazily (autoIndex), so there are no migrations to run.
 */
const opts = (collection: string) => ({ collection, timestamps: true as const });

function make<T>(name: string, schema: Schema<T>): Model<T> {
  return (models[name] as Model<T> | undefined) ?? model<T>(name, schema);
}

// ── Settings + audit ────────────────────────────────────────────────────────────────────────────
export interface ISetting { key: string; value: unknown; updatedBy?: string }
export const AutodmSetting = make<ISetting>("AutodmSetting", new Schema<ISetting>({ key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed, updatedBy: String }, opts("autodm_settings")));

export interface IAudit { actor: string; action: string; key?: string; oldValue?: unknown; newValue?: unknown; ip?: string; createdAt: Date }
export const AutodmAudit = make<IAudit>("AutodmAudit", new Schema<IAudit>({ actor: { type: String, required: true }, action: { type: String, required: true }, key: String, oldValue: Schema.Types.Mixed, newValue: Schema.Types.Mixed, ip: String }, opts("autodm_audit_logs")).index({ createdAt: -1 }));

// ── Accounts ────────────────────────────────────────────────────────────────────────────────────
export type AccountStatus = "active" | "token_expired" | "revoked" | "disabled_by_admin" | "error";
export interface IAccount {
  _id: Types.ObjectId;
  ownerId: string; // partner id
  platform: "instagram" | "facebook";
  externalAccountId: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
  accountType: string;
  accessTokenEncrypted: string;
  tokenExpiresAt?: Date | null;
  tokenLastRefreshedAt?: Date | null;
  scopes: string[];
  status: AccountStatus;
  webhookSubscribed: boolean;
  lastError?: string;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
const accountSchema = new Schema<IAccount>({
  ownerId: { type: String, required: true, index: true },
  platform: { type: String, enum: ["instagram", "facebook"], required: true },
  externalAccountId: { type: String, required: true },
  username: { type: String, default: "" },
  displayName: String,
  profilePictureUrl: String,
  accountType: { type: String, default: "" },
  accessTokenEncrypted: { type: String, required: true, select: false },
  tokenExpiresAt: { type: Date, default: null },
  tokenLastRefreshedAt: { type: Date, default: null },
  scopes: { type: [String], default: [] },
  status: { type: String, enum: ["active", "token_expired", "revoked", "disabled_by_admin", "error"], default: "active" },
  webhookSubscribed: { type: Boolean, default: false },
  lastError: String,
  connectedAt: { type: Date, default: () => new Date() },
}, opts("autodm_connected_accounts"));
accountSchema.index({ platform: 1, externalAccountId: 1 }, { unique: true });
accountSchema.index({ status: 1, tokenExpiresAt: 1 });
export const AutodmAccount = make<IAccount>("AutodmAccount", accountSchema);

export interface IOAuthState { stateHash: string; ownerId: string; platform: "instagram" | "facebook"; expiresAt: Date; usedAt?: Date | null }
const stateSchema = new Schema<IOAuthState>({ stateHash: { type: String, required: true, unique: true }, ownerId: { type: String, required: true }, platform: { type: String, required: true }, expiresAt: { type: Date, required: true }, usedAt: { type: Date, default: null } }, opts("autodm_oauth_states"));
stateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });
export const AutodmOAuthState = make<IOAuthState>("AutodmOAuthState", stateSchema);

// ── Automations ─────────────────────────────────────────────────────────────────────────────────
export interface IAutomation {
  _id: Types.ObjectId;
  ownerId: string;
  accountId: Types.ObjectId;
  name: string;
  status: "draft" | "active" | "paused" | "error";
  triggerType: "comment" | "story_reply" | "story_mention" | "dm_keyword" | "dm_default";
  mediaId?: string | null;
  mediaPermalink?: string;
  mediaThumbnail?: string;
  keywordList: string[];
  matchType: "contains" | "exact" | "any";
  caseSensitive: boolean;
  dmMessage: string;
  dmButtons: { label: string; url: string }[];
  commentReplyVariants: string[];
  sendOncePerUser: boolean;
  captureEmail: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  stats: { triggered: number; sent: number; failed: number; skipped: number; replies: number };
  pausedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
const automationSchema = new Schema<IAutomation>({
  ownerId: { type: String, required: true, index: true },
  accountId: { type: Schema.Types.ObjectId, ref: "AutodmAccount", required: true },
  name: { type: String, required: true, maxlength: 80 },
  status: { type: String, enum: ["draft", "active", "paused", "error"], default: "draft" },
  triggerType: { type: String, enum: ["comment", "story_reply", "story_mention", "dm_keyword", "dm_default"], required: true },
  mediaId: { type: String, default: null },
  mediaPermalink: String,
  mediaThumbnail: String,
  keywordList: { type: [String], default: [] },
  matchType: { type: String, enum: ["contains", "exact", "any"], default: "contains" },
  caseSensitive: { type: Boolean, default: false },
  dmMessage: { type: String, default: "" },
  dmButtons: { type: [{ _id: false, label: String, url: String }], default: [] },
  commentReplyVariants: { type: [String], default: [] },
  sendOncePerUser: { type: Boolean, default: true },
  captureEmail: { type: Boolean, default: false },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  stats: {
    triggered: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
  },
  pausedReason: String,
}, opts("autodm_automations"));
automationSchema.index({ accountId: 1, status: 1 });
export const AutodmAutomation = make<IAutomation>("AutodmAutomation", automationSchema);

// ── Webhook events ──────────────────────────────────────────────────────────────────────────────
export interface IWebhookEvent {
  _id: Types.ObjectId;
  provider: string;
  dedupeKey: string;
  accountExternalId: string;
  eventType: string;
  normalized?: unknown;
  rawPayload?: unknown;
  signatureValid: boolean;
  status: "received" | "queued" | "processed" | "ignored" | "failed";
  note?: string;
  error?: string;
  receivedAt: Date;
  processedAt?: Date | null;
}
const eventSchema = new Schema<IWebhookEvent>({
  provider: { type: String, default: "meta" },
  dedupeKey: { type: String, required: true, unique: true },
  accountExternalId: { type: String, index: true },
  eventType: String,
  normalized: Schema.Types.Mixed,
  rawPayload: Schema.Types.Mixed,
  signatureValid: { type: Boolean, default: true },
  status: { type: String, enum: ["received", "queued", "processed", "ignored", "failed"], default: "received" },
  note: String,
  error: String,
  receivedAt: { type: Date, default: () => new Date() },
  processedAt: { type: Date, default: null },
}, { collection: "autodm_webhook_events" });
eventSchema.index({ receivedAt: -1 });
eventSchema.index({ status: 1, receivedAt: -1 });
export const AutodmWebhookEvent = make<IWebhookEvent>("AutodmWebhookEvent", eventSchema);

// ── Conversations / messages ───────────────────────────────────────────────────────────────────
export interface IConversation {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  ownerId: string;
  externalUserId: string;
  username?: string;
  lastInboundAt?: Date | null;
  lastOutboundAt?: Date | null;
  windowExpiresAt?: Date | null;
  status: "open" | "closed";
  awaitingEmailFor?: Types.ObjectId | null;
  updatedAt: Date;
}
const convSchema = new Schema<IConversation>({
  accountId: { type: Schema.Types.ObjectId, required: true },
  ownerId: { type: String, required: true, index: true },
  externalUserId: { type: String, required: true },
  username: String,
  lastInboundAt: { type: Date, default: null },
  lastOutboundAt: { type: Date, default: null },
  windowExpiresAt: { type: Date, default: null },
  status: { type: String, default: "open" },
  awaitingEmailFor: { type: Schema.Types.ObjectId, default: null },
}, opts("autodm_conversations"));
convSchema.index({ accountId: 1, externalUserId: 1 }, { unique: true });
convSchema.index({ ownerId: 1, updatedAt: -1 });
export const AutodmConversation = make<IConversation>("AutodmConversation", convSchema);

export interface IMessage { _id: Types.ObjectId; conversationId: Types.ObjectId; ownerId: string; direction: "inbound" | "outbound"; externalMessageId?: string; content: string; triggerEventId?: Types.ObjectId | null; createdAt: Date }
const msgSchema = new Schema<IMessage>({ conversationId: { type: Schema.Types.ObjectId, required: true, index: true }, ownerId: { type: String, required: true }, direction: { type: String, enum: ["inbound", "outbound"], required: true }, externalMessageId: String, content: { type: String, default: "" }, triggerEventId: { type: Schema.Types.ObjectId, default: null } }, opts("autodm_messages"));
msgSchema.index({ createdAt: 1 });
msgSchema.index({ conversationId: 1, externalMessageId: 1 }, { unique: true, partialFilterExpression: { externalMessageId: { $type: "string" } } });
export const AutodmMessage = make<IMessage>("AutodmMessage", msgSchema);

// ── Runs ────────────────────────────────────────────────────────────────────────────────────────
export type RunStatus = "pending" | "sent" | "failed" | "skipped_master_disabled" | "skipped_feature_disabled" | "skipped_account_inactive" | "skipped_sending_disabled" | "skipped_daily_cap" | "skipped_already_sent" | "skipped_window_expired" | "skipped_no_recipient";
export interface IRun {
  _id: Types.ObjectId;
  automationId: Types.ObjectId;
  accountId: Types.ObjectId;
  ownerId: string;
  webhookEventId?: Types.ObjectId | null;
  externalUserId: string;
  username?: string;
  triggerRef: string;
  triggerType: string;
  action: "private_reply" | "dm" | "public_reply";
  status: RunStatus;
  skipReason?: string;
  metaResponse?: Record<string, unknown>;
  attemptCount: number;
  errorCode?: string;
  errorMessage?: string;
  triggerAt: Date;
  commentId?: string;
  sentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
const runSchema = new Schema<IRun>({
  automationId: { type: Schema.Types.ObjectId, required: true },
  accountId: { type: Schema.Types.ObjectId, required: true },
  ownerId: { type: String, required: true, index: true },
  webhookEventId: { type: Schema.Types.ObjectId, default: null },
  externalUserId: { type: String, required: true },
  username: String,
  triggerRef: { type: String, required: true },
  triggerType: String,
  action: { type: String, enum: ["private_reply", "dm", "public_reply"], required: true },
  status: { type: String, default: "pending" },
  skipReason: String,
  metaResponse: Schema.Types.Mixed,
  attemptCount: { type: Number, default: 0 },
  errorCode: String,
  errorMessage: String,
  triggerAt: { type: Date, required: true },
  commentId: String,
  sentAt: { type: Date, default: null },
}, opts("autodm_runs"));
runSchema.index({ automationId: 1, triggerRef: 1, action: 1 }, { unique: true });
runSchema.index({ accountId: 1, status: 1, sentAt: -1 });
runSchema.index({ automationId: 1, externalUserId: 1 });
runSchema.index({ createdAt: -1 });
export const AutodmRun = make<IRun>("AutodmRun", runSchema);

// ── Leads / link clicks ─────────────────────────────────────────────────────────────────────────
export interface ILead { _id: Types.ObjectId; accountId: Types.ObjectId; ownerId: string; automationId: Types.ObjectId; externalUserId: string; username?: string; email?: string | null; source: string; capturedAt: Date; consentNote?: string }
const leadSchema = new Schema<ILead>({ accountId: { type: Schema.Types.ObjectId, required: true }, ownerId: { type: String, required: true, index: true }, automationId: { type: Schema.Types.ObjectId, required: true }, externalUserId: { type: String, required: true }, username: String, email: { type: String, default: null }, source: String, capturedAt: { type: Date, default: () => new Date() }, consentNote: String }, opts("autodm_leads"));
leadSchema.index({ accountId: 1, externalUserId: 1, automationId: 1 }, { unique: true });
leadSchema.index({ ownerId: 1, capturedAt: -1 });
export const AutodmLead = make<ILead>("AutodmLead", leadSchema);

export interface ILinkClick { _id: Types.ObjectId; token: string; url: string; ownerId: string; automationId: Types.ObjectId; runId?: Types.ObjectId | null; clicks: number; lastClickedAt?: Date | null; firstClickedAt?: Date | null; createdAt: Date }
const linkSchema = new Schema<ILinkClick>({ token: { type: String, required: true, unique: true }, url: { type: String, required: true }, ownerId: { type: String, required: true, index: true }, automationId: { type: Schema.Types.ObjectId, required: true, index: true }, runId: { type: Schema.Types.ObjectId, default: null }, clicks: { type: Number, default: 0 }, lastClickedAt: { type: Date, default: null }, firstClickedAt: { type: Date, default: null } }, opts("autodm_link_clicks"));
export const AutodmLinkClick = make<ILinkClick>("AutodmLinkClick", linkSchema);

// ── Jobs (DB-backed queue), notifications, deletion requests ────────────────────────────────────
export interface IJob { _id: Types.ObjectId; queue: string; type: string; payload: Record<string, unknown>; status: "queued" | "running" | "done" | "dead"; runAt: Date; attempts: number; lockedAt?: Date | null; lastError?: string; createdAt: Date }
const jobSchema = new Schema<IJob>({ queue: { type: String, required: true }, type: { type: String, required: true }, payload: Schema.Types.Mixed, status: { type: String, default: "queued" }, runAt: { type: Date, default: () => new Date() }, attempts: { type: Number, default: 0 }, lockedAt: { type: Date, default: null }, lastError: String }, opts("autodm_jobs"));
jobSchema.index({ status: 1, runAt: 1 });
jobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 3600, partialFilterExpression: { status: "done" } });
export const AutodmJob = make<IJob>("AutodmJob", jobSchema);

export interface INotification { _id: Types.ObjectId; ownerId: string; kind: string; message: string; readAt?: Date | null; createdAt: Date }
const noteSchema = new Schema<INotification>({ ownerId: { type: String, required: true }, kind: String, message: String, readAt: { type: Date, default: null } }, opts("autodm_notifications"));
noteSchema.index({ ownerId: 1, createdAt: -1 });
export const AutodmNotification = make<INotification>("AutodmNotification", noteSchema);

export interface IDeletion { code: string; externalUserId: string; status: "pending" | "done"; counts?: Record<string, number>; completedAt?: Date | null; createdAt: Date }
export const AutodmDeletion = make<IDeletion>("AutodmDeletion", new Schema<IDeletion>({ code: { type: String, required: true, unique: true }, externalUserId: { type: String, required: true }, status: { type: String, default: "pending" }, counts: Schema.Types.Mixed, completedAt: { type: Date, default: null } }, opts("autodm_deletion_requests")));
