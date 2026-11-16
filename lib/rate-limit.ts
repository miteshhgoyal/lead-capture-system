import { dbConnect } from "./db";
import { RateLimit } from "./models/RateLimit";

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

export async function hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    await dbConnect();
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowSeconds * 1000);

    await RateLimit.updateOne({ key, resetAt: { $lte: now } }, { $set: { count: 0, resetAt } });
    const run = () =>
      RateLimit.findOneAndUpdate(
        { key },
        { $inc: { count: 1 }, $setOnInsert: { resetAt } },
        { upsert: true, returnDocument: "after" }
      );

    let doc;
    try {
      doc = await run();
    } catch (e) {
      if (typeof e === "object" && e !== null && (e as { code?: number }).code === 11000) {
        doc = await run();
      } else {
        throw e;
      }
    }
    if (!doc) return { ok: true, retryAfter: 0 };
    return {
      ok: doc.count <= limit,
      retryAfter: Math.max(1, Math.ceil((doc.resetAt.getTime() - now.getTime()) / 1000)),
    };
  } catch (err) {
    console.error("[rate-limit] Error:", err);
    // Graceful degradation: don't block users if rate limiting DB fails
    return { ok: true, retryAfter: 0 };
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() ?? "127.0.0.1";
}
