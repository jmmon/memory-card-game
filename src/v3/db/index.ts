import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as DatabaseSchema from "./schemas";
import type { D1Database } from "@cloudflare/workers-types";

export * from "./schemas";

// export type AppDatabase = DrizzleD1Database<typeof DatabaseSchema>;

export type DrizzleDb = DrizzleD1Database<typeof DatabaseSchema> & {
  $client: D1Database;
};

let _db: DrizzleDb;

export function getDB() {
  // eslint-disable-next-line
  if (!_db) {
    throw new Error("DB not set");
  }
  return _db;
}

export async function initializeDbIfNeeded(factory: () => Promise<DrizzleDb>) {
  // eslint-disable-next-line
  if (!_db) {
    _db = await factory();
  }
}
