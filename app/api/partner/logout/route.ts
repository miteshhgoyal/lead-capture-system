import { fail, json, sameOrigin } from "@/lib/http";
import { clearPartnerSession } from "@/lib/partner-auth";

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  await clearPartnerSession();
  return json({ ok: true });
}
