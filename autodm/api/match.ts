export interface RouteLike {
  method: string;
  /** e.g. "automations/:id/activate" */
  path: string;
}

/** Pure matcher: "automations/:id" against ["automations","abc"]. */
export function matchRoute<R extends RouteLike>(routes: R[], method: string, segments: string[]): { route: R; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const parts = route.path.split("/").filter(Boolean);
    if (parts.length !== segments.length) continue;
    const params: Record<string, string> = {};
    let okMatch = true;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(":")) params[parts[i].slice(1)] = decodeURIComponent(segments[i]);
      else if (parts[i] !== segments[i]) {
        okMatch = false;
        break;
      }
    }
    if (okMatch) return { route, params };
  }
  return null;
}

