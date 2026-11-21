import { dispatch } from "@/autodm/api/router";
import { publicRoutes, userRoutes } from "@/autodm/api/user";

export const dynamic = "force-dynamic";

const routes = [...userRoutes, ...publicRoutes];

async function handle(req: Request, ctx: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const { path = [] } = await ctx.params;
  return dispatch(routes, req, path);
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE };
