import { after } from "next/server";
import { isValidObjectId } from "mongoose";
import { fail, json, sameOrigin } from "@/lib/http";
import { adminOr401 } from "@/lib/admin-auth";
import { generateBroadcast, requeueFailedRewrites } from "@/lib/telegram/deliveries";

export const maxDuration = 300;

/** Re-runs the rewrites that failed for a broadcast (Gemini errors, rate limits). Send failures are not retried. */
export async function POST(req: Request, props: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const admin = await adminOr401();
  if (admin instanceof Response) return admin;
  const { id } = await props.params;
  if (!isValidObjectId(id)) return fail(404, "not_found");

  const requeued = await requeueFailedRewrites(id);
  if (requeued > 0) after(() => generateBroadcast(id).catch((e) => console.error("[telegram] retry generation failed:", e)));
  return json({ ok: true, requeued });
}
