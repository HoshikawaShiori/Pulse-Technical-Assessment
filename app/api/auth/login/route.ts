import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as Record<string, unknown>;

  const result = await login({
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
  });

  if (!result.ok) {
    // Return 401 for wrong credentials, 400 for validation errors
    const status = result.error ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json({ ok: true });
}