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

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=()",
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const canonicalHost = getCanonicalHost();
  const host = normalizeHost(request.headers.get("host"));

  if (!shouldForceCanonicalHost(host, canonicalHost)) {
    return applySecurityHeaders(NextResponse.next());
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.host = canonicalHost;
  redirectUrl.protocol = "https:";

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

