import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const updated = await updateSettings(body);
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/settings PUT] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update settings" }, { status: 500 });
  }
}
