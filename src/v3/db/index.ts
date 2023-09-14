import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {scores as scoresSchema} from "./scores.schema";
import {scoreCounts as scoreCountsSchema} from "./scoreCounts.schema";
import { relations } from "drizzle-orm";

// const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const connectionString = "postgresql://postgres:postgres@localhost:5432/memory-card-game-scores"

export const scores = scoresSchema;
export const scoreCounts = scoreCountsSchema;

/* =====================================================
 * Relations:
 * ===================================================== */

// each score has one scoreCounts
export const scoresRelations = relations(scores, ({one}) => ({
  scoreCounts: one(scoreCounts, {
    fields: [scores.id],
    references: [scoreCounts.id],
  }),
}));

// each scoreCounts has many scores
export const scoreCountsRelations = relations(scoreCounts, ({many}) => ({
  scores: many(scores),
}))


const client = postgres(connectionString);
export const db = drizzle(client, {schema: {...scoresSchema, ...scoreCountsSchema, ...scoresRelations, ...scoreCountsRelations}});

