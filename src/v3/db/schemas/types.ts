import { scoresSchema } from "./index";

export type Score = typeof scoresSchema.$inferSelect;
