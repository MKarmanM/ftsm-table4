import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

// Deliberately "thin": this only checks the cookie's HMAC signature and
// expiry (no database call) to decide whether to redirect to /login.
// The authoritative check — does this user still exist and is active —
// happens in getCurrentUser() (lib/auth.ts) inside Server Components,
// which is where real access decisions should be made.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Run on every route except static assets/Next internals.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
