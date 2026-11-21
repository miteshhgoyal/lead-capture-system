import { adminRoutes } from "@/autodm/api/admin";
import { dispatch } from "@/autodm/api/router";

export const dynamic = "force-dynamic";

async function handle(req: Request, ctx: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const { path = [] } = await ctx.params;
  return dispatch(adminRoutes, req, path);
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
