import {
  scores,
  scoreCounts,
} from "./index";

export type Score = typeof scores.$inferSelect & {
  scoreCounts: typeof scoreCounts.$inferSelect;
};
export type NewScore = typeof scores.$inferInsert;

export type ScoreCounts = typeof scoreCounts.$inferSelect & {
  scores: typeof scores.$inferSelect[];
};
export type NewScoreCounts = typeof scoreCounts.$inferInsert;
