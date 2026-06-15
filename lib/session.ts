import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export interface SessionPayload {
  userId: string;
  sessionId: string;
  expiresAt: Date;
}

function getEncodedKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  const encodedKey = getEncodedKey();
  return new SignJWT({ userId: payload.userId, sessionId: payload.sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = "",
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const encodedKey = getEncodedKey();
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store session in database
  const dbSession = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  // Create encrypted JWT
  const token = await encrypt({
    userId,
    sessionId: dbSession.id,
    expiresAt,
  });

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const payload = await decrypt(cookie);

  if (!payload) return null;

  // Verify the session still exists in the database and hasn't expired
  const dbSession = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    select: { id: true, expiresAt: true },
  });

  if (!dbSession || dbSession.expiresAt < new Date()) {
    // Clean up expired session
    if (dbSession) {
      await prisma.session.delete({ where: { id: dbSession.id } }).catch(() => {});
    }
    await deleteSessionCookie();
    return null;
  }

  return payload;
}

export async function updateSession(): Promise<void> {
  const payload = await verifySession();
  if (!payload) return;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Extend database session expiry
  await prisma.session.update({
    where: { id: payload.sessionId },
    data: { expiresAt },
  });

  // Extend cookie expiry
  const token = await encrypt({
    userId: payload.userId,
    sessionId: payload.sessionId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const payload = await decrypt(cookie);

  if (payload) {
    // Remove from database
    await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
  }

  await deleteSessionCookie();
}

async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "lax",
    path: "/",
  });
}