import { type RequestHandler } from "@builder.io/qwik-city";
import { drizzle } from "drizzle-orm/d1";
import { type DrizzleDb, initializeDbIfNeeded } from "~/v3/db";
import type { Env } from "~/v3/types/types";

export const onRequest: RequestHandler = async ({ platform }) => {
  const env = platform.env as Env;
  await initializeDbIfNeeded(initD1(env));
};

function initD1(env: Env): () => Promise<DrizzleDb> {
  return async () => drizzle(env.DB, { logger: true });
}
