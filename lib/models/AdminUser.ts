import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAdminUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: "superadmin" | "admin";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "Admin", trim: true },
    role: { type: String, enum: ["superadmin", "admin"], default: "admin" },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

adminUserSchema.index({ email: 1 }, { unique: true });

export const AdminUser: Model<IAdminUser> =
  (models.AdminUser as Model<IAdminUser> | undefined) ?? model<IAdminUser>("AdminUser", adminUserSchema);
