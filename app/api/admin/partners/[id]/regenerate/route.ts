import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { requireAdmin } from "@/lib/admin-auth";
import { regeneratePartnerPage } from "@/lib/page-builder/persist";

/** Admin only: re-rolls this partner's landing page (new seed, layouts, copy, theme and section order). */
export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await props.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
    }

    const config = await regeneratePartnerPage(id);
    if (!config) {
      return NextResponse.json({ ok: false, error: "Partner not found" }, { status: 404 });
    }

    await dbConnect();
    const partner = await Partner.findById(id, { slug: 1 }).lean();
    try {
      if (partner) revalidatePath(`/${partner.slug}`);
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({
      ok: true,
      seed: config.seed,
      themeConfig: config.themeConfig,
      sectionOrder: config.sectionOrder,
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/partners/[id]/regenerate POST] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to regenerate page" }, { status: 500 });
  }
}
