import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/chat/history?pairId=xxx
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pairId = searchParams.get("pairId");
  const sessionId = searchParams.get("sessionId");
  if (!pairId) {
    return NextResponse.json({ error: "missing pairId" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }

  // Basic pairId format validation: "idA|idB"
  const pairParts = pairId.split("|");
  if (pairParts.length !== 2) {
    return NextResponse.json({ error: "invalid pairId" }, { status: 400 });
  }

  // Ensure requester (sessionId) is one of the participants and has presence
  if (sessionId !== pairParts[0] && sessionId !== pairParts[1]) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const presence = await prisma.presence.findUnique({ where: { id: sessionId } });
  if (!presence) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // If both participants have authenticated userIds, prefer the canonical
  // user-based pair key so history follows user accounts across sessions.
  const otherSessionId = sessionId === pairParts[0] ? pairParts[1] : pairParts[0];

  // Fetch full presence rows and treat as any to avoid TS client/schema sync issues.
  const mePresence = (await prisma.presence.findUnique({ where: { id: sessionId } })) as any;
  const otherPresence = (await prisma.presence.findUnique({ where: { id: otherSessionId } })) as any;

  let canonicalPair: string | null = null;
  if (mePresence?.userId && otherPresence?.userId) {
    const a = mePresence.userId < otherPresence.userId ? mePresence.userId : otherPresence.userId;
    const b = a === mePresence.userId ? otherPresence.userId : mePresence.userId;
    canonicalPair = `${a}|${b}`;
  }

  // Query messages for both the session-based pair and (if available) the
  // canonical user-based pair; merge and sort by createdAt, dedup by id.
  const queryPairs = canonicalPair ? [canonicalPair, pairId] : [pairId];
  const rows = await prisma.message.findMany({
    where: { pairId: { in: queryPairs } },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, text: true, createdAt: true },
  });

  // Deduplicate by id while preserving order.
  const seen = new Set<string>();
  const messages: { id: string; senderId: string; text: string; createdAt: string }[] = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    messages.push({ id: r.id, senderId: r.senderId, text: r.text, createdAt: r.createdAt.toISOString() });
  }

  return NextResponse.json({ messages });
}
