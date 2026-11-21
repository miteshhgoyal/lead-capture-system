import { revalidatePath } from "next/cache";
import { fail, json, sameOrigin } from "@/lib/http";
import { partnerOr401 } from "@/lib/partner-auth";
import { regeneratePartnerPage } from "@/lib/page-builder/persist";
import { hit } from "@/lib/rate-limit";

/** Partner re-rolls their own page: new layout variants, copy, theme and section order. */
export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const session = await partnerOr401();
  if (session instanceof Response) return session;

  const rl = await hit(`partner_shuffle_${String(session._id)}`, 20, 3600);
  if (!rl.ok) return fail(429, "Too many shuffles. Try again later.");

  const config = await regeneratePartnerPage(session._id);
  if (!config) return fail(404, "Partner not found");
  try {
    revalidatePath(`/${session.slug}`);
  } catch {
    /* ignore */
  }
  return json({ ok: true });
}
