import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/chat/send — body { pairId, senderId, text }
export async function POST(request: NextRequest) {
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

  // Basic pairId format validation
  const parts = pairId.split("|");
  if (parts.length !== 2) {
    return NextResponse.json({ error: "invalid pairId" }, { status: 400 });
  }

  // Ensure senderId is one of the participants in the pair
  if (senderId !== parts[0] && senderId !== parts[1]) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Resolve canonical pair key: prefer authenticated userId pairing when both
  // participants are logged in; otherwise fall back to session-based pair.
  const otherSessionId = senderId === parts[0] ? parts[1] : parts[0];
  // Prisma client may be out-of-sync with schema in the dev environment;
  // fetch full rows and treat as unknown to avoid strict TS errors here.
  const mePresence = (await prisma.presence.findUnique({ where: { id: senderId } })) as any;
  const otherPresence = (await prisma.presence.findUnique({ where: { id: otherSessionId } })) as any;

  let canonicalPair = pairId;
  if (mePresence?.userId && otherPresence?.userId) {
    const a = mePresence.userId < otherPresence.userId ? mePresence.userId : otherPresence.userId;
    const b = a === mePresence.userId ? otherPresence.userId : mePresence.userId;
    canonicalPair = `${a}|${b}`;
  }

  // Persist message under canonical pair id so conversation follows user accounts.
  const msg = await prisma.message.create({
    data: {
      pairId: canonicalPair,
      senderId,
      text: text.trim(),
    },
  });

  return NextResponse.json({ id: msg.id, createdAt: msg.createdAt.toISOString() });
}
