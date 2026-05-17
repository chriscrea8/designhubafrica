import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) { return NextResponse.next(); },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ["/", "/about", "/designers", "/marketplace", "/inspiration", "/login", "/register", "/forgot-password"];
        const { pathname } = req.nextUrl;
        if (publicPaths.some((p) => pathname === p) || pathname.startsWith("/api/")) return true;
        return !!token;
      },
    },
  }
);

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons).*)"] };
