import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { AdminUser } from "@/lib/models/AdminUser";
import { requireAdmin, hashPassword, verifyPassword } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await dbConnect();
    let adminUser = await AdminUser.findOne({ email: admin.email.toLowerCase() });

    if (!adminUser) {
      // If admin logged in via env vars, create the DB record with new password
      adminUser = await AdminUser.create({
        email: admin.email.toLowerCase(),
        passwordHash: hashPassword(newPassword),
        name: "Admin",
        role: "superadmin",
      });
      return NextResponse.json({ ok: true, message: "Password updated successfully" });
    }

    // Verify current password if user has passwordHash
    if (adminUser.passwordHash && currentPassword) {
      const match = verifyPassword(currentPassword, adminUser.passwordHash);
      if (!match) {
        return NextResponse.json({ ok: false, error: "Current password is incorrect" }, { status: 400 });
      }
    }

    adminUser.passwordHash = hashPassword(newPassword);
    await adminUser.save();

    return NextResponse.json({ ok: true, message: "Password updated successfully" });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/change-password] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to change password" }, { status: 500 });
  }
}
