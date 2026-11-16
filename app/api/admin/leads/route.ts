import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { requireAdmin } from "@/lib/admin-auth";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/validation/lead";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};

    // Search query across name, phone, email
    const q = (searchParams.get("q") || "").trim();
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    // Filter by Partner
    const partnerSlug = searchParams.get("partnerSlug");
    if (partnerSlug && partnerSlug !== "all") {
      query.partnerSlug = partnerSlug;
    }

    // Filter by Status
    const status = searchParams.get("status");
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by Country
    const country = searchParams.get("country");
    if (country && country !== "all") {
      query.country = country;
    }

    // Filter by Capital
    const capital = searchParams.get("capital");
    if (capital && capital !== "all") {
      query.capital = capital;
    }

    // Filter by Date Range
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Sorting
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    await dbConnect();
    const [leads, total] = await Promise.all([
      Lead.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Lead.countDocuments(query),
    ]);

    const formatted = leads.map((l) => ({
      ...l,
      _id: l._id.toString(),
      partnerId: l.partnerId?.toString() || null,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      leads: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/leads GET] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch leads" }, { status: 500 });
  }
}

// Bulk update status
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No lead IDs provided" }, { status: 400 });
    }

    if (!LEAD_STATUS_OPTIONS.includes(status as LeadStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid status value" }, { status: 400 });
    }

    const validIds = ids.filter((id) => isValidObjectId(id));
    await dbConnect();
    const result = await Lead.updateMany(
      { _id: { $in: validIds } },
      { $set: { status, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to bulk update leads" }, { status: 500 });
  }
}

// Bulk delete
export async function DELETE(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No lead IDs provided" }, { status: 400 });
    }

    const validIds = ids.filter((id) => isValidObjectId(id));
    await dbConnect();
    const result = await Lead.deleteMany({ _id: { $in: validIds } });

    return NextResponse.json({ ok: true, deletedCount: result.deletedCount });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to bulk delete leads" }, { status: 500 });
  }
}
