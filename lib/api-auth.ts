import "server-only";
import { verifySession } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * Require an authenticated session for an API route.
 * Returns the session payload if authenticated, or a 401 response.
 */
export async function requireAuth(): Promise<
  | { userId: string; sessionId: string }
  | Response
> {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return { userId: session.userId, sessionId: session.sessionId };
}