import { Schema, model, models, type Model, type Types } from "mongoose";

/** One-time token behind a "Connect Telegram group" deep link (30 min, single use). */
export interface IConnectToken {
  _id: Types.ObjectId;
  token: string;
  partnerId: Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date | null;
  /** The group that consumed the token, so a retried group_connected webhook is answered the same way. */
  usedForChatId?: string | null;
  createdAt: Date;
}

const connectTokenSchema = new Schema<IConnectToken>(
  {
    token: { type: String, required: true },
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    usedForChatId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

connectTokenSchema.index({ token: 1 }, { unique: true });
// Mongo deletes tokens a day after they expire: long enough to answer webhook retries.
connectTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 3600 });

export const ConnectToken: Model<IConnectToken> =
  (models.ConnectToken as Model<IConnectToken> | undefined) ?? model<IConnectToken>("ConnectToken", connectTokenSchema);
