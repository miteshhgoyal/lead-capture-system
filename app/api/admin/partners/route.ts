import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { Lead } from "@/lib/models/Lead";
import { PartnerSchema, isReservedSlug } from "@/lib/validation/partner";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const partners = await Partner.find({}).sort({ createdAt: -1 }).lean();

    // Aggregate lead counts per partner slug
    const leadCounts = await Lead.aggregate([
      { $group: { _id: "$partnerSlug", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    for (const item of leadCounts) {
      if (item._id) countMap.set(item._id, item.count);
    }

    const enriched = partners.map((p) => ({
      ...p,
      _id: p._id.toString(),
      leadsCount: countMap.get(p.slug) || 0,
    }));

    return NextResponse.json({ ok: true, partners: enriched });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/partners GET] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch partners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const parsed = PartnerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: issue ? issue.message : "Invalid partner data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug.toLowerCase().trim();

    if (isReservedSlug(slug)) {
      return NextResponse.json(
        { ok: false, error: `Slug "${slug}" is reserved for system use` },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check uniqueness
    const existing = await Partner.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `A partner with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    const partner = await Partner.create({
      ...data,
      slug,
      createdBy: admin.email,
    });

    // On-demand revalidation for instant zero-redeploy updates
    try {
      revalidatePath(`/${slug}`);
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors if any
    }

    return NextResponse.json({
      ok: true,
      partner: {
        ...partner.toObject(),
        _id: partner._id.toString(),
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/partners POST] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create partner" }, { status: 500 });
  }
}
