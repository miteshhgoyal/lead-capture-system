import { timingSafeEqual } from "node:crypto";
import { fail, json } from "@/lib/http";
import { expireStale, resumeStuckGeneration } from "@/lib/telegram/deliveries";

export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.TELEGRAM_CRON_SECRET ?? "";
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || given.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

/**
 * Scheduler entry point (every 5-15 minutes is plenty):
 *   - expires pending previews older than 24h
 *   - finishes preview generation that a killed after() worker left behind
 */
async function run(req: Request): Promise<Response> {
  if (!authorized(req)) return fail(401, "unauthorized");
  const expired = await expireStale();
  const resumed = await resumeStuckGeneration({ max: 5, budgetMs: 40_000 });
  return json({ ok: true, expired, resumed });
}

export const GET = run;
export const POST = run;
