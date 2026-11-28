import { BotError, rewrite } from "@/lib/bot";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { partnerOr401 } from "@/lib/partner-auth";
import { hit } from "@/lib/rate-limit";
import { TelegramPreviewSchema } from "@/lib/validation/telegram";

export const maxDuration = 60;

/** Rewrites a partner's sample message for preview only; it is never saved or sent. */
export async function POST(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const partner = await partnerOr401();
  if (partner instanceof Response) return partner;

  const parsed = TelegramPreviewSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(400, parsed.error.issues[0]?.message ?? "Invalid preview");

  const limit = await hit(`tg_preview_${String(partner._id)}`, 10, 3600);
  if (!limit.ok) {
    return fail(429, "rate_limited", { message: "Too many previews. Try again in about an hour." });
  }

  try {
    const result = await rewrite(parsed.data.text, parsed.data.style);
    if (typeof result.text !== "string" || !result.text.trim()) {
      return fail(502, "empty_preview", { message: "The preview was empty. Please try again." });
    }
    return json({ ok: true, text: result.text, unchanged: result.unchanged === true });
  } catch (e) {
    if (!(e instanceof BotError)) throw e;
    if (e.code === "bot_not_configured") {
      return fail(503, e.code, { message: "Message previews are temporarily unavailable." });
    }
    if (e.code === "bot_timeout" || e.code === "bot_unreachable") {
      return fail(502, e.code, { message: "The preview service did not respond. Please try again." });
    }
    if (e.status === 429) {
      return fail(429, e.code, { message: "The preview service is busy. Please try again shortly." });
    }
    return fail(502, e.code, { message: "Could not create a preview. Please try again." });
  }
}
