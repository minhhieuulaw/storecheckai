import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema";

// Lazy getter so missing env var throws at runtime (not build time)
function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET environment variable is not set");
  return new TextEncoder().encode(s);
}
export const COOKIE_NAME    = "session";
export const DISPLAY_COOKIE = "user_display";
export const SESSION_DAYS   = 7;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: string;                   // 'free' | 'starter' | 'personal' | 'pro'
  checksRemaining: number;
  billingPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  isBanned: boolean;
}

export interface SessionPayload {
  sub: string;   // user.id
  email: string;
  name: string;
}

// ── DB helpers ─────────────────────────────────────────────────────────────────

import type { UserRow } from "./schema";
function rowToUser(r: UserRow): User {
  return {
    id: r.id, email: r.email, name: r.name, passwordHash: r.passwordHash,
    plan: r.plan, checksRemaining: r.checksRemaining,
    billingPeriodEnd: r.billingPeriodEnd ?? null,
    stripeCustomerId: r.stripeCustomerId ?? null,
    stripeSubscriptionId: r.stripeSubscriptionId ?? null,
    createdAt: r.createdAt,
    isBanned: r.isBanned ?? false,
  };
}

export async function findUser(email: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function createUser(email: string, name: string, passwordHash: string): Promise<User> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.insert(users).values({
    id,
    email: email.toLowerCase().trim(),
    name: name.trim(),
    passwordHash,
    plan: "free",
    checksRemaining: 1,
    createdAt,
  });
  return (await findUser(email))!;
}

export async function updateUser(id: string, data: Partial<{
  name: string;
  passwordHash: string;
  plan: string;
  checksRemaining: number;
  billingPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  isBanned: boolean;
}>): Promise<void> {
  await db.update(users).set(data).where(eq(users.id, id));
}

// ── Password (PBKDF2) ──────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100_000, 32, "sha256", (err, key) => {
      if (err) reject(err);
      else resolve(`pbkdf2:sha256:100000:${salt}:${key.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split(":");
  if (parts.length !== 5) return false;
  const [, , iterStr, salt, stored] = parts;
  const iterations = parseInt(iterStr, 10);
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, 32, "sha256", (err, key) => {
      if (err) reject(err);
      else {
        try {
          // Timing-safe comparison prevents timing attacks on password hashes
          const derived  = Buffer.from(key.toString("hex"));
          const expected = Buffer.from(stored);
          // timingSafeEqual requires equal-length buffers — mismatch means wrong hash format
          if (derived.length !== expected.length) { resolve(false); return; }
          resolve(crypto.timingSafeEqual(derived, expected));
        } catch {
          resolve(false);
        }
      }
    });
  });
}

// ── JWT (jose) ─────────────────────────────────────────────────────────────────

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
