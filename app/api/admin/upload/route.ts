import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { processAndSaveUpload } from "@/lib/upload";

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const result = await processAndSaveUpload(file);
    return NextResponse.json({ ok: true, url: result.url, filename: result.filename });
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/admin/upload] Error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Upload failed" },
      { status: 400 }
    );
  }
}
