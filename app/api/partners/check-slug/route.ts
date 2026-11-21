import { json } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { Partner } from "@/lib/models/Partner";
import { hit, clientIp } from "@/lib/rate-limit";
import { isReservedSlug } from "@/lib/validation/partner";

/** Public: is this page link free? (sign-up form). Rate limited. */
export async function GET(req: Request): Promise<Response> {
  const rl = await hit(`slug_check_${clientIp(req)}`, 60, 60);
  if (!rl.ok) return json({ available: false, reason: "Too many checks. Wait a moment." }, 429);

  const slug = (new URL(req.url).searchParams.get("slug") || "").toLowerCase().trim();
  if (slug.length < 2 || slug.length > 50 || !/^[a-z0-9-]+$/.test(slug)) {
    return json({ available: false, reason: "Use 2-50 letters, numbers or hyphens." });
  }
  if (isReservedSlug(slug)) return json({ available: false, reason: "This link is reserved." });

  await dbConnect();
  const taken = await Partner.exists({ slug });
  return json({ available: !taken, reason: taken ? "This link is already taken." : "" });
}
