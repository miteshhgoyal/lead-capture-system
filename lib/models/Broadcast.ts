import { Schema, model, models, type Model, type Types } from "mongoose";

/** One message written by the company. Fans out to one Delivery per connected group. */
export interface IBroadcast {
  _id: Types.ObjectId;
  text: string;
  createdBy: string;
  deliveryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const broadcastSchema = new Schema<IBroadcast>(
  {
    text: { type: String, required: true },
    createdBy: { type: String, required: true },
    deliveryCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

broadcastSchema.index({ createdAt: -1 });

export const Broadcast: Model<IBroadcast> =
  (models.Broadcast as Model<IBroadcast> | undefined) ?? model<IBroadcast>("Broadcast", broadcastSchema);
