import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function authMiddleware(request: NextRequest) {
  const token = request.cookies.get("fe_auth_token")?.value;
  const url = request.nextUrl;

  if (url.pathname === "/login") {
    const force = url.searchParams.get("force");
    if (token && !force)
      return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  const isPublic = ["/", "/about"].includes(url.pathname);
  if (isPublic) return NextResponse.next();

  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    // chạy middleware với mọi route trừ: _next, api, favicon...
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
