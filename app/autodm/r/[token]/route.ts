import { resolveClick } from "@/autodm/links";

export const dynamic = "force-dynamic";

/** Tracked link redirect. Always available (links already sent must keep working), counts the click, redirects to the https destination. */
export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const url = await resolveClick(token).catch(() => null);
  if (!url) return new Response("Link not found", { status: 404 });
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
