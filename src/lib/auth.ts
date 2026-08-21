import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";

const SESSION_COOKIE = "esc_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Falta AUTH_SECRET en las variables de entorno.");
    }
    return "desarrollo-inseguro-cambiar-en-produccion";
  }
  return value;
}

// --- contraseñas (scrypt, sin dependencias externas) ---

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const derived = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  if (derived.length !== expectedBuffer.length) return false;
  return timingSafeEqual(derived, expectedBuffer);
}

// --- sesión firmada en cookie ---

type SessionPayload = { id: string; name: string; exp: number };

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export async function createSession(user: { id: string; name: string }) {
  const payload: SessionPayload = {
    id: user.id,
    name: user.name,
    exp: Date.now() + MAX_AGE_SECONDS * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ id: string; name: string } | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return { id: payload.id, name: payload.name };
  } catch {
    return null;
  }
}

/** ¿Todavía no hay ninguna cuenta? Entonces toca crear la primera. */
export async function needsFirstAdmin(): Promise<boolean> {
  return (await prisma.adminUser.count()) === 0;
}

export const MIN_PASSWORD_LENGTH = 10;

export async function authenticate(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}
