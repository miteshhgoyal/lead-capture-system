import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { PartnerSchema, isReservedSlug } from "@/lib/validation/partner";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const params = await props.params;
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();
    const partner = await Partner.findById(id).lean();
    if (!partner) {
      return NextResponse.json({ ok: false, error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      partner: { ...partner, _id: partner._id.toString() },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch partner" }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const params = await props.params;
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = PartnerSchema.partial().safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: issue ? issue.message : "Invalid partner update" },
        { status: 400 }
      );
    }

    await dbConnect();
    const existing = await Partner.findById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Partner not found" }, { status: 404 });
    }

    const oldSlug = existing.slug;
    const data = parsed.data;

    if (data.slug) {
      const newSlug = data.slug.toLowerCase().trim();
      if (isReservedSlug(newSlug)) {
        return NextResponse.json(
          { ok: false, error: `Slug "${newSlug}" is reserved for system use` },
          { status: 400 }
        );
      }

      if (newSlug !== oldSlug) {
        const slugConflict = await Partner.findOne({ slug: newSlug, _id: { $ne: id } }).lean();
        if (slugConflict) {
          return NextResponse.json(
            { ok: false, error: `A partner with slug "${newSlug}" already exists` },
            { status: 409 }
          );
        }
        existing.slug = newSlug;
      }
    }

    if (data.name !== undefined) existing.name = data.name;
    if (data.telegramLink !== undefined) existing.telegramLink = data.telegramLink;
    if (data.whatsappGroupLink !== undefined) existing.whatsappGroupLink = data.whatsappGroupLink;
    if (data.zoomLink !== undefined) existing.zoomLink = data.zoomLink;
    if (data.isActive !== undefined) existing.isActive = data.isActive;
    if (data.tagline !== undefined) existing.tagline = data.tagline;
    if (data.mentorBio !== undefined) existing.mentorBio = data.mentorBio;
    if (data.logoUrl !== undefined) existing.logoUrl = data.logoUrl;
    if (data.faviconUrl !== undefined) existing.faviconUrl = data.faviconUrl;
    if (data.theme !== undefined) {
      existing.theme = {
        primaryColor: data.theme.primaryColor || existing.theme?.primaryColor || "#3b36e0",
      };
    }

    const updated = await existing.save();

    // Revalidate old and new paths for instant zero-redeploy updates
    try {
      revalidatePath(`/${oldSlug}`);
      if (updated.slug !== oldSlug) revalidatePath(`/${updated.slug}`);
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({
      ok: true,
      partner: { ...updated.toObject(), _id: updated._id.toString() },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/partners/[id] PATCH] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update partner" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const params = await props.params;
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();
    const deleted = await Partner.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Partner not found" }, { status: 404 });
    }

    try {
      revalidatePath(`/${deleted.slug}`);
      revalidatePath("/");
    } catch {
      // Ignore
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to delete partner" }, { status: 500 });
  }
}
