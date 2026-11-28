import { Schema, model, models, type Model, type Types } from "mongoose";

/** A Telegram group a partner connected through the bot. A partner can have several. */
export interface ITelegramGroup {
  _id: Types.ObjectId;
  /** Telegram chat id, always a string (supergroup ids exceed 2^53 safe-integer range in some clients). */
  chatId: string;
  title: string;
  partnerId: Types.ObjectId;
  /** False after the bot was removed from the group or the partner disconnected it. */
  active: boolean;
  connectedByTelegramUserId?: string;
  connectedByTelegramUsername?: string;
  connectedAt: Date;
  disconnectedAt?: Date | null;
  disconnectReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const telegramGroupSchema = new Schema<ITelegramGroup>(
  {
    chatId: { type: String, required: true },
    title: { type: String, default: "", trim: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    active: { type: Boolean, default: true },
    connectedByTelegramUserId: { type: String },
    connectedByTelegramUsername: { type: String },
    connectedAt: { type: Date, default: () => new Date() },
    disconnectedAt: { type: Date, default: null },
    disconnectReason: { type: String, default: null },
  },
  { timestamps: true }
);

telegramGroupSchema.index({ chatId: 1 }, { unique: true });
telegramGroupSchema.index({ partnerId: 1, active: 1 });
telegramGroupSchema.index({ active: 1 });

export const TelegramGroup: Model<ITelegramGroup> =
  (models.TelegramGroup as Model<ITelegramGroup> | undefined) ?? model<ITelegramGroup>("TelegramGroup", telegramGroupSchema);
