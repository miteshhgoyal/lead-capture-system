import { isValidObjectId } from "mongoose";
import { fail, json, readJson, sameOrigin } from "@/lib/http";
import { partnerOr401 } from "@/lib/partner-auth";
import { hit } from "@/lib/rate-limit";
import { approveDelivery, regenerateDelivery, rejectDelivery, type ActionResult } from "@/lib/telegram/deliveries";

export const maxDuration = 60;

const MESSAGES: Record<string, string> = {
  not_found: "This message was not found.",
  not_pending: "This message is no longer waiting for approval.",
  expired: "This message expired (not approved within 24 hours).",
  preview_changed: "The preview changed since you opened it. Review the new text and approve again.",
  group_disconnected: "This group is no longer connected. Reconnect it first.",
  in_progress: "Already sending. Wait a moment and refresh.",
  rate_limited: "Telegram is rate limiting the bot. Try again in a minute.",
  bot_removed_or_blocked: "The bot was removed from this group or cannot post there.",
  unknown_group: "The bot does not know this group any more. Reconnect it.",
  rewrite_failed: "Could not generate a new version. The previous preview is kept.",
  bot_timeout: "The bot did not answer in time. You can try again safely.",
  bot_unreachable: "The bot could not be reached. You can try again safely.",
};

/** Partner acts on one of their deliveries: approve (post), regenerate (new preview) or reject. */
export async function POST(req: Request, props: { params: Promise<{ id: string; action: string }> }): Promise<Response> {
  if (!sameOrigin(req)) return fail(403, "forbidden");
  const partner = await partnerOr401();
  if (partner instanceof Response) return partner;

  const { id, action } = await props.params;
  if (!isValidObjectId(id)) return fail(404, "not_found");

  let r: ActionResult;
  if (action === "approve") {
    const body = (await readJson(req)) as { version?: unknown; autoApproveFuture?: unknown } | null;
    const version = Number(body?.version);
    if (!Number.isInteger(version)) return fail(400, "version is required");
    r = await approveDelivery(id, partner._id, version, { enableAutoApprove: body?.autoApproveFuture === true });
  } else if (action === "regenerate") {
    const rl = await hit(`tg_regen_${String(partner._id)}`, 30, 3600);
    if (!rl.ok) return fail(429, "Too many regenerations. Try again later.");
    r = await regenerateDelivery(id, partner._id);
  } else if (action === "reject") {
    r = await rejectDelivery(id, partner._id);
  } else {
    return fail(404, "not_found");
  }

  if (r.ok) return json(r);
  return fail(r.status, r.error, { message: MESSAGES[r.error] ?? "Something went wrong. Please try again.", retryable: r.retryable ?? false });
}
