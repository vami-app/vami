import { NextResponse } from "next/server";

const RESERVED_SUBDOMAINS = [
  "www", "api", "admin", "mail", "app", "blog", "static",
  "cdn", "assets", "help", "support", "status", "dev", "staging"
];

export function middleware(req) {
  const enableSubdomains = process.env.NEXT_PUBLIC_ENABLE_SUBDOMAINS === "true";
  if (!enableSubdomains) {
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  const isLocalhost = hostname.includes("localhost");
  const baseDomain = isLocalhost ? "localhost:3000" : "inkwell.app";

  if (hostname && hostname !== baseDomain) {
    const parts = hostname.split(".");
    const subdomain = parts[0];

    if (
      subdomain &&
      !RESERVED_SUBDOMAINS.includes(subdomain) &&
      !hostname.startsWith("localhost")
    ) {
      const path = url.pathname === "/" ? "" : url.pathname;
      return NextResponse.rewrite(
        new URL(`/@${subdomain}${path}${url.search}`, req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|uploads|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
