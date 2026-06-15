import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/chat/send — body { pairId, senderId, text }
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { pairId, senderId, text } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof pairId !== "string" ||
    typeof senderId !== "string" ||
    typeof text !== "string" ||
    !text.trim()
  ) {
    return NextResponse.json({ error: "invalid fields" }, { status: 400 });
  }

  const msg = await prisma.message.create({
    data: {
      pairId,
      senderId,
      text: text.trim(),
    },
  });

  return NextResponse.json({ id: msg.id, createdAt: msg.createdAt.toISOString() });
}