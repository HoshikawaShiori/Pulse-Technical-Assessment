import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// Protected routes — must be authenticated
const protectedRoutes = ["/"];

// Public-only routes — redirect to "/" if already authenticated
const publicRoutes = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // Decrypt the session from the cookie
  const sessionCookie = req.cookies.get("session")?.value;
  const session = await decrypt(sessionCookie);

  // Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect to / if the user is already authenticated
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};