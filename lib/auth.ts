import "server-only";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, verifySession } from "@/lib/session";

// Validation schemas
export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(64, "Name must be at most 64 characters")
    .trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

export interface AuthResult {
  ok: boolean;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  // Validate input
  const validated = SignupSchema.safeParse(input);
  if (!validated.success) {
    return {
      ok: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validated.data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      errors: { email: ["An account with this email already exists"] },
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  // Create session
  await createSession(user.id);

  return { ok: true };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  // Validate input
  const validated = LoginSchema.safeParse(input);
  if (!validated.success) {
    return {
      ok: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return {
      ok: false,
      error: "Invalid email or password",
    };
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return {
      ok: false,
      error: "Invalid email or password",
    };
  }

  // Create session
  await createSession(user.id);

  return { ok: true };
}

export async function logout(): Promise<void> {
  await deleteSession();
}

export async function getCurrentUser(): Promise<{
  id: string;
  name: string;
  email: string;
} | null> {
  const payload = await verifySession();
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true },
  });

  return user;
}