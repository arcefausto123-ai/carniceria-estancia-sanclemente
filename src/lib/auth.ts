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

type SessionPayload = { id: string; name: string; v: number; exp: number };

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export async function createSession(user: { id: string; name: string; sessionVersion: number }) {
  const payload: SessionPayload = {
    id: user.id,
    name: user.name,
    v: user.sessionVersion,
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

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
  } catch {
    return null;
  }
  if (payload.exp < Date.now()) return null;

  // La firma sólo prueba que la cookie la emitimos nosotros. Contrastamos
  // contra la base para que cambiar la contraseña corte las sesiones que
  // hubiera abiertas en otro lado.
  const user = await prisma.adminUser.findUnique({
    where: { id: payload.id },
    select: { name: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== payload.v) return null;

  return { id: payload.id, name: user.name };
}

/** ¿Todavía no hay ninguna cuenta? Entonces toca crear la primera. */
export async function needsFirstAdmin(): Promise<boolean> {
  return (await prisma.adminUser.count()) === 0;
}

export const MIN_PASSWORD_LENGTH = 10;

/** Intentos fallidos permitidos antes de bloquear la cuenta, y por cuánto. */
export const MAX_FAILED_LOGINS = 8;
export const LOCKOUT_MINUTES = 15;

export type AuthResult =
  | { ok: true; user: { id: string; name: string; sessionVersion: number } }
  | { ok: false; reason: "credenciales" }
  | { ok: false; reason: "bloqueada"; minutes: number };

/**
 * Verifica las credenciales y frena la fuerza bruta: tras varios fallos
 * seguidos la cuenta queda bloqueada un rato. El contador vive en la base
 * porque en serverless cada instancia tiene su propia memoria.
 */
export async function authenticate(email: string, password: string): Promise<AuthResult> {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Comparamos igual contra un hash descartable cuando el usuario no existe,
  // para no delatar por tiempo de respuesta qué correos están registrados.
  if (!user) {
    verifyPassword(password, hashPassword("usuario-inexistente"));
    return { ok: false, reason: "credenciales" };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000));
    return { ok: false, reason: "bloqueada", minutes };
  }

  if (!verifyPassword(password, user.passwordHash)) {
    const failed = user.failedLogins + 1;
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        failedLogins: failed,
        lockedUntil:
          failed >= MAX_FAILED_LOGINS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
            : null,
      },
    });
    return failed >= MAX_FAILED_LOGINS
      ? { ok: false, reason: "bloqueada", minutes: LOCKOUT_MINUTES }
      : { ok: false, reason: "credenciales" };
  }

  if (user.failedLogins > 0 || user.lockedUntil) {
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    });
  }

  return { ok: true, user: { id: user.id, name: user.name, sessionVersion: user.sessionVersion } };
}
