import { Schema, model, models, type Model, type Types } from "mongoose";

export const DELIVERY_STATUSES = ["generating", "pending_approval", "sending", "sent", "rejected", "failed", "expired"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/**
 * One broadcast rewritten for one group, waiting for (or past) the partner's approval.
 *
 * Lifecycle: generating → pending_approval → sending → sent
 *                                     ├→ rejected   (partner said no)
 *                                     └→ expired    (not approved within 24h)
 *            generating / sending → failed           (rewrite or send failed for good)
 * Regenerate moves pending_approval → generating → pending_approval and bumps `version`.
 */
export interface IDelivery {
  _id: Types.ObjectId;
  broadcastId: Types.ObjectId;
  groupId: Types.ObjectId;
  /** Copied from the group at fan-out: ownership checks never depend on the group's current owner. */
  partnerId: Types.ObjectId;
  /** Style snapshot used for the latest rewrite. */
  style: string;
  preview?: string | null;
  /** The bot reported the rewrite left the text unchanged. */
  unchanged?: boolean;
  /** Bumped on every new preview. Approve must name the version the partner saw. */
  version: number;
  /** True when this preview was posted automatically under the partner's saved preference. */
  autoApproved: boolean;
  status: DeliveryStatus;
  /** Set when status became `generating`; lets the cron job pick up work a dead process left behind. */
  generatingSince?: Date | null;
  /** First time a preview was ready. The 24h approval window starts here and regenerating does not extend it. */
  pendingSince?: Date | null;
  regenerations: number;
  approvedAt?: Date | null;
  /** Last /send attempt; a delivery stuck in `sending` can be retried after a short lock. */
  sendAttemptAt?: Date | null;
  sentAt?: Date | null;
  telegramMessageId?: number | null;
  failedStage?: "generate" | "send" | null;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
  {
    broadcastId: { type: Schema.Types.ObjectId, ref: "Broadcast", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "TelegramGroup", required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    style: { type: String, required: true },
    preview: { type: String, default: null },
    unchanged: { type: Boolean, default: false },
    version: { type: Number, default: 0 },
    autoApproved: { type: Boolean, default: false },
    status: { type: String, enum: DELIVERY_STATUSES, required: true },
    generatingSince: { type: Date, default: null },
    pendingSince: { type: Date, default: null },
    regenerations: { type: Number, default: 0 },
    approvedAt: { type: Date, default: null },
    sendAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    telegramMessageId: { type: Number, default: null },
    failedStage: { type: String, enum: ["generate", "send", null], default: null },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

deliverySchema.index({ broadcastId: 1, groupId: 1 }, { unique: true });
deliverySchema.index({ partnerId: 1, status: 1, createdAt: -1 });
deliverySchema.index({ status: 1, pendingSince: 1 });
deliverySchema.index({ status: 1, generatingSince: 1 });

export const Delivery: Model<IDelivery> =
  (models.Delivery as Model<IDelivery> | undefined) ?? model<IDelivery>("Delivery", deliverySchema);
