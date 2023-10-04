import {
  integer,
  pgTable,
  serial,
  json,
  timestamp,
  interval,
  varchar,
} from "drizzle-orm/pg-core";
import type { LessThanOurScoreObj } from "../types/types";
import { sql } from "drizzle-orm";

export const scoreCounts = pgTable("scoreCounts", {
  id: serial("id").primaryKey(),
  deckSize: integer("deckSize"),
  worseThanOurMismatchesMap: json(
    "worseThanOurMismatchesMap"
  ).$type<LessThanOurScoreObj>(),
  worseThanOurGameTimeMap: json(
    "worseThanOurGameTimeMap"
  ).$type<LessThanOurScoreObj>(),
  totalScores: integer("totalScores"),
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("createdAt", { withTimezone: true }).default(sql`now()`),
  deckSize: integer("deckSize"),
  gameTime: interval("gameTime", { precision: 6 }),
  mismatches: integer("mismatches"),
  pairs: integer("pairs"),
  userId: varchar("userId", { length: 64 }), // some uuid, hashed value of an identifier/hash
  initials: varchar("initials", { length: 32 }), // some optional inputted string??
  color: varchar("color", { length: 32 }), // hsl(xxx, xxx%, xxx%)
  pixels: varchar("pixels", { length: 256 }), // binary
  // scoreCounts: integer("scoreCounts"),
});


