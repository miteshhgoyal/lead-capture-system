import { z } from "zod";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { createAdminSession, authenticateAdmin } from "@/lib/admin-auth";
import { hit, clientIp } from "@/lib/rate-limit";

const Body = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");

  const ip = clientIp(req);
  const rl = await hit(`admin_login_${ip}`, 8, 900); // 8 attempts per 15 min
  if (!rl.ok) {
    return fail(429, "rate_limited", {
      message: `Too many login attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.`,
      retryAfter: rl.retryAfter,
    });
  }

  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) {
    return fail(400, "invalid_credentials", { message: "Invalid email or password format." });
  }

  const { email, password } = parsed.data;
  const ok = await authenticateAdmin(email, password);

  if (!ok) {
    // Artificial delay to prevent timing brute-force
    await new Promise((r) => setTimeout(r, 600));
    return fail(401, "invalid_credentials", { message: "Invalid email or password." });
  }

  await createAdminSession({ email });
  return json({ ok: true, email });
}
