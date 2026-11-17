import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { regenerateRootPage } from "@/lib/page-builder/persist";

/** Admin only: shuffles the root page (`/`). Body `{ "original": true }` restores the original design. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json().catch(() => ({}))) as { original?: boolean };
    const config = await regenerateRootPage(body.original ? { legacy: true, seed: 0 } : {});
    try {
      revalidatePath("/");
    } catch {
      // Ignore cache revalidation errors
    }
    return NextResponse.json({ ok: true, seed: config.seed, sectionOrder: config.sectionOrder });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/settings/regenerate POST] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to shuffle page" }, { status: 500 });
  }
}
