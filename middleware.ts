import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_CANONICAL_HOST = "carepass-eight.vercel.app";

function getCanonicalHost() {
  return (
    process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim().toLowerCase() ||
    DEFAULT_CANONICAL_HOST
  );
}

function normalizeHost(hostHeader: string | null) {
  return (hostHeader ?? "").split(":")[0].trim().toLowerCase();
}

function shouldForceCanonicalHost(host: string, canonicalHost: string) {
  if (!host || host === canonicalHost) {
    return false;
  }

  // Prevent map auth mismatch when users open ephemeral Vercel deployment URLs.
  return host.endsWith(".vercel.app");
}

export function middleware(request: NextRequest) {
  const canonicalHost = getCanonicalHost();
  const host = normalizeHost(request.headers.get("host"));

  if (!shouldForceCanonicalHost(host, canonicalHost)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.host = canonicalHost;
  redirectUrl.protocol = "https:";

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

