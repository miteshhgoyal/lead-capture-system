import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { isReservedSlug } from "@/lib/validation/partner";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const slug = (searchParams.get("slug") || "").toLowerCase().trim();
    const currentId = searchParams.get("currentId");

    if (!slug) {
      return NextResponse.json({ available: false, reason: "Slug cannot be empty" });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({
        available: false,
        reason: "Only lowercase letters, numbers, and hyphens are allowed",
      });
    }

    if (isReservedSlug(slug)) {
      return NextResponse.json({ available: false, reason: "This slug is reserved by the system" });
    }

    await dbConnect();
    const query: any = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const existing = await Partner.findOne(query).lean();
    if (existing) {
      return NextResponse.json({ available: false, reason: "Slug is already taken by another partner" });
    }

    return NextResponse.json({ available: true });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ available: false, reason: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ available: false, reason: "Server check error" }, { status: 500 });
  }
}
