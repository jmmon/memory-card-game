// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
import {
  scores,
  // scoresRelations as scoresRelationsSchema,
} from "./scores.schema";
import {
  scoreCounts,
  // scoreCountsRelations as scoreCountsRelationsSchema,
} from "./scoreCounts.schema";
export { scores, scoreCounts };

// const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// const connectionString =
//   "postgresql://postgres:postgres@localhost:5432/memory-card-game-scores";

// const connectionString =
//   "postgresql://postgres:postgres@localhost:5432/memory-card-game-scores";

// export const scoresRelations = scoresRelationsSchema;
// export const scoreCountsRelations = scoreCountsRelationsSchema;

// const client = postgres(connectionString);
// export const db = drizzle(client, {
//   schema: {
//     scores,
//     scoreCounts,
//     // ...scoresRelations,
//     // ...scoreCountsRelations,
//   },
// });
