import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy singleton — only throws at runtime when DATABASE_URL is actually needed
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set. See .env.local for setup instructions.");
  }
  _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  return _db;
}

// Convenience alias — call getDb() internally
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
