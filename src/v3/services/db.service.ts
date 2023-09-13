import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { scores } from "../db/schema";
import { type NewScore } from "../db/types";
import { server$ } from "@builder.io/qwik-city";

// submitWin(data): submits the win and calculates and returns your percentile scores

// getCategory(deckSize): returns list of scores matching deck size
// getAllScores(): returns all scores
//
const getAllScores = () => db.select().from(scores);

const getScoresByDeckSize = (deckSize: number) =>
  getAllScores().where(eq(scores.deckSize, deckSize));

const createScore = (data: NewScore) => {
  if (!data.createdAt) data.createdAt = new Date();
  return db.insert(scores).values(data).returning();
};

const serverDbService = {
  getAllScores: server$(getAllScores),
  getScoresByDeckSize: server$(getScoresByDeckSize),
  createScore: server$(createScore),
};

export default serverDbService;
