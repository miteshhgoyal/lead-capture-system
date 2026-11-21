import { fail, json, sameOrigin } from "@/lib/http";
import { hit, clientIp } from "@/lib/rate-limit";
import { processAndSaveUpload } from "@/lib/upload";

/** Public logo upload used by the partner sign-up form. Same-origin + rate limited. */
export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const rl = await hit(`partner_upload_${clientIp(req)}`, 10, 3600);
  if (!rl.ok) return fail(429, "Too many uploads. Try again later.");

  try {
    const file = (await req.formData()).get("file");
    if (!file || !(file instanceof File)) return fail(400, "No file provided");
    const { url } = await processAndSaveUpload(file);
    return json({ ok: true, url });
  } catch (e) {
    return fail(400, e instanceof Error ? e.message : "Upload failed");
  }
}
