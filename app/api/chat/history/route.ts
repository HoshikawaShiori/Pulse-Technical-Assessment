import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/history?pairId=xxx
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof Response) return auth;

  const { searchParams } = request.nextUrl;
  const pairId = searchParams.get("pairId");
  if (!pairId) {
    return NextResponse.json({ error: "missing pairId" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { pairId },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, text: true, createdAt: true },
  });

  return NextResponse.json({ messages });
}