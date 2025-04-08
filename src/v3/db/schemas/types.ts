import type { scoreCounts, scores } from "./index";

export type Score = typeof scores.$inferSelect;
export type InsertScore = typeof scores.$inferInsert;

export type ScoreCount = typeof scoreCounts.$inferSelect;
export type InsertScoreCount = typeof scoreCounts.$inferInsert;
