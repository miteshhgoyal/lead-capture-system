import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // 1. Admin Authentication Guards
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminCookie = request.cookies.get("fogm_admin")?.value;
    if (!adminCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
    const adminCookie = request.cookies.get("fogm_admin")?.value;
    if (!adminCookie) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  // 2. Wildcard Subdomain Rewriting (optional, enabled by env flag)
  const enableSubdomains = process.env.ENABLE_SUBDOMAINS === "true";
  const rootDomain = process.env.ROOT_DOMAIN; // e.g. "freecourselink.com" or "localhost:3000"

  if (enableSubdomains && rootDomain) {
    const host = request.headers.get("host") || "";
    // Clean port from host if rootDomain doesn't specify one
    const cleanHost = host.toLowerCase().split(":")[0];
    const cleanRoot = rootDomain.toLowerCase().split(":")[0];

    if (cleanHost !== cleanRoot && cleanHost.endsWith(`.${cleanRoot}`)) {
      const subdomain = cleanHost.slice(0, -(cleanRoot.length + 1));
      const ignoredSubdomains = ["www", "admin", "api", "mail", "app", "dashboard"];

      if (subdomain && !ignoredSubdomains.includes(subdomain)) {
        // Rewrite subdomain root to partner route: partner.domain.com/ -> /partner
        // But do not rewrite static files or api routes
        if (
          !pathname.startsWith("/api") &&
          !pathname.startsWith("/_next") &&
          !pathname.startsWith("/static") &&
          !pathname.startsWith("/public") &&
          !pathname.startsWith("/uploads") &&
          !pathname.includes(".")
        ) {
          const rewriteUrl = new URL(`/${subdomain}${pathname === "/" ? "" : pathname}`, request.url);
          const response = NextResponse.rewrite(rewriteUrl, {
            request: { headers: requestHeaders },
          });
          applySecurityHeaders(response);
          return response;
        }
      }
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
