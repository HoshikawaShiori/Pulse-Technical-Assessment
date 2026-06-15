import { NextRequest, NextResponse } from "next/server";
import { signup } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, password } = (body ?? {}) as Record<string, unknown>;

  const result = await signup({
    name: typeof name === "string" ? name : "",
    email: typeof email === "string" ? email : "",
    password: typeof password === "string" ? password : "",
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}