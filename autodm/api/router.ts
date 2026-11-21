import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { fail } from "@/lib/http";
import { sameOrigin } from "@/lib/http";
import { getPartnerSession } from "@/lib/partner-auth";
import { clientIp, hit } from "@/lib/rate-limit";
import type { IPartner } from "@/lib/models/Partner";
import { FeatureGate, GateError } from "../settings-store";

import { matchRoute } from "./match";
export { matchRoute };

export interface Ctx {
  req: Request;
  sp: URLSearchParams;
  params: Record<string, string>;
  ip: string;
  /** Set for "partner" routes. */
  partner?: IPartner;
  ownerId: string;
  /** Set for "admin" routes. */
  admin?: { email: string; id?: string };
}
export type Handler = (c: Ctx) => Promise<Response>;
export interface Route {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** e.g. "automations/:id/activate" */
  path: string;
  auth: "partner" | "admin" | "public";
  /** Feature flag that must be on for this route (403 with a clear message when off). */
  flag?: string;
  handler: Handler;
}

/**
 * One entry point for a whole API area: auth, the FeatureGate (master switch, allowed users, feature flag),
 * CSRF (Origin check) on mutating browser routes, rate limiting and uniform error handling.
 * Public routes (webhook-style callbacks) do their own verification.
 */
export async function dispatch(routes: Route[], req: Request, segments: string[]): Promise<Response> {
  const found = matchRoute(routes, req.method, segments);
  if (!found) return fail(404, "Not found");
  const { route, params } = found;
  const ctx: Ctx = { req, sp: new URL(req.url).searchParams, params, ip: clientIp(req), ownerId: "" };

  try {
    if (route.auth === "admin") {
      ctx.admin = await requireAdmin();
      if (req.method !== "GET" && !sameOrigin(req)) return fail(403, "Bad origin");
    } else if (route.auth === "partner") {
      const partner = await getPartnerSession();
      if (!partner) return fail(401, "unauthorized");
      ctx.partner = partner;
      ctx.ownerId = String(partner._id);
      // master switch off (or user not allowed) = the API does not exist
      if (!(await FeatureGate.isEnabled("autodm.enabled")) || !(await FeatureGate.userAllowed({ id: ctx.ownerId }))) return fail(404, "Not found");
      if (route.flag) await FeatureGate.assertEnabled(route.flag);
      if (req.method !== "GET" && !sameOrigin(req)) return fail(403, "Bad origin");
      const rl = await hit(`autodm:u:${ctx.ownerId}`, 240, 60);
      if (!rl.ok) return fail(429, "Too many requests", { retryAfter: rl.retryAfter });
    }
    return await route.handler(ctx);
  } catch (e) {
    if (e instanceof GateError) return fail(e.status, e.message, e.extra ?? {});
    if (e instanceof ZodError) return fail(400, e.issues[0]?.message ?? "Invalid input");
    if ((e as { status?: number })?.status === 401) return fail(401, "unauthorized");
    console.error(`[autodm] ${route.method} /${route.path} failed:`, e instanceof Error ? e.message : "error");
    return fail(500, "Something went wrong");
  }
}

export const idParam = (v: string | undefined): string | null => (v && /^[a-f0-9]{24}$/i.test(v) ? v : null);
export const pageParams = (sp: URLSearchParams, max = 100) => {
  const limit = Math.min(max, Math.max(5, Number(sp.get("limit")) || 25));
  const page = Math.max(1, Number(sp.get("page")) || 1);
  return { limit, page, skip: (page - 1) * limit };
};
