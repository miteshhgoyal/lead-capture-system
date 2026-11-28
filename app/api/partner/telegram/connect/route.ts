import { randomBytes } from "node:crypto";
import { fail, json, sameOrigin } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { partnerOr401 } from "@/lib/partner-auth";
import { hit } from "@/lib/rate-limit";
import { connectLink } from "@/lib/bot";
import { ConnectToken } from "@/lib/models/ConnectToken";

const TOKEN_TTL_MS = 30 * 60 * 1000;

/** Issues a one-time "add the bot to your group" deep link for the signed-in partner. */
export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const partner = await partnerOr401();
  if (partner instanceof Response) return partner;

  const rl = await hit(`tg_connect_${String(partner._id)}`, 10, 3600);
  if (!rl.ok) return fail(429, "Too many connect links. Try again later.");

  const token = randomBytes(32).toString("base64url"); // 43 chars, allowed in Telegram deep links
  let url: string;
  try {
    url = connectLink(token);
  } catch {
    return fail(503, "Telegram is not configured yet. Please contact the admin.");
  }
  await dbConnect();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await ConnectToken.create({ token, partnerId: partner._id, expiresAt });
  return json({ ok: true, url, expiresAt: expiresAt.toISOString() });
}
