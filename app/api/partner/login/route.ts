import { z } from "zod";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { hit, clientIp } from "@/lib/rate-limit";
import { dbConnect } from "@/lib/db";
import { Partner, type IPartner } from "@/lib/models/Partner";
import { verifyPassword } from "@/lib/admin-auth";
import { createPartnerSession } from "@/lib/partner-auth";

const Body = z.object({ loginId: z.string().trim().toLowerCase().min(1).max(100), password: z.string().min(1).max(200) });

// A real-looking hash so unknown login IDs cost the same time as wrong passwords.
const DUMMY_HASH = "00000000000000000000000000000000:" + "0".repeat(128);

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, "Enter your login ID and password.");
  const { loginId, password } = parsed.data;

  const rl = await hit(`partner_login_${clientIp(req)}_${loginId}`, 8, 900);
  if (!rl.ok) return fail(429, `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.`);

  await dbConnect();
  const partner = await Partner.findOne({ loginId }).select("+passwordHash").lean<IPartner | null>();
  const ok = verifyPassword(password, partner?.passwordHash ?? DUMMY_HASH);

  if (!partner || !partner.passwordHash || !ok) {
    await new Promise((r) => setTimeout(r, 600));
    return fail(401, "Invalid login ID or password.");
  }
  if (!partner.isActive) return fail(403, "This partner account is inactive. Please contact the admin.");

  await createPartnerSession(partner);
  return json({ ok: true });
}
