import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";
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
    // Page configs are only written by the shuffle action.
    for (const k of ["layoutConfig", "contentConfig", "themeConfig", "sectionOrder", "seed"]) delete body[k];
    if (body.primaryColor !== undefined && body.primaryColor !== "" && !/^#[0-9a-f]{6}$/i.test(body.primaryColor)) {
      return NextResponse.json({ ok: false, error: "Brand colour must be a hex value like #0f766e" }, { status: 400 });
    }
    const updated = await updateSettings(body);
    try {
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }
    return NextResponse.json({ ok: true, settings: updated });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/settings PUT] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update settings" }, { status: 500 });
  }
}
