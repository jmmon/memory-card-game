import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const client = postgres(connectionString);
export const db = drizzle(client);
