import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/lib/models/Lead";
import { requireAdmin } from "@/lib/admin-auth";
import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/validation/lead";

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const params = await props.params;
    const { id } = params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });
    }

    await dbConnect();
    const lead = await Lead.findById(id).lean();
    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      lead: {
        ...lead,
        _id: lead._id.toString(),
        partnerId: lead.partnerId?.toString() || null,
        createdAt: lead.createdAt.toISOString(),
        updatedAt: lead.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch lead" }, { status: 500 });
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
    const update: any = {};

    if (body.status !== undefined) {
      if (!LEAD_STATUS_OPTIONS.includes(body.status as LeadStatus)) {
        return NextResponse.json({ ok: false, error: "Invalid status value" }, { status: 400 });
      }
      update.status = body.status;
    }

    if (body.notes !== undefined) {
      update.notes = String(body.notes);
    }

    await dbConnect();
    const updated = await Lead.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      lead: {
        ...updated,
        _id: updated._id.toString(),
        partnerId: updated.partnerId?.toString() || null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to update lead" }, { status: 500 });
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
    const deleted = await Lead.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to delete lead" }, { status: 500 });
  }
}
