import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyPrivacyOffset, isValidLatLng } from "@/lib/geo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/join — body { id, lat, lng } (raw coords).
// Applies a 1–3 km privacy offset and upserts the presence row. Raw
// coordinates are never stored.
export async function POST(request: NextRequest) {


  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }

  const { id, lat, lng, userId } = (body ?? {}) as Record<string, unknown>;

  if (typeof id !== "string" || id.length < 8 || id.length > 64) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  // (Keep authentication optional for presence advertising; callers provide a client-generated id)

  if (!isValidLatLng(lat, lng)) {
    return Response.json({ error: "invalid coordinates" }, { status: 400 });
  }

  const offset = applyPrivacyOffset(lat as number, lng as number);

  // Upsert without userId to avoid runtime errors if Prisma client/schema are
  // temporarily out-of-sync. Persist userId in a separate update that we
  // swallow on failure (safe-guard for dev mismatches).
  await prisma.presence.upsert({
    where: { id },
    create: {
      id,
      lat: offset.lat,
      lng: offset.lng,
      busy: false,
      lastSeen: new Date(),
    },
    update: {
      lat: offset.lat,
      lng: offset.lng,
      // Reset busy on explicit join so re-entering clears stale busy flags.
      busy: false,
      lastSeen: new Date(),
    },
  });

  if (typeof userId === "string") {
    try {
      await prisma.presence.update({
        where: { id },
        data: { userId },
      });
    } catch {
      // Ignore errors from updating userId — tolerates environments where the
      // Prisma client/schema are not yet in sync.
    }
  }

  return Response.json({ ok: true });
}
