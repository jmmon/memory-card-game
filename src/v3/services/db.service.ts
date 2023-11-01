import { eq } from "drizzle-orm";
import { db } from "~/v3/db/index";
import { scores } from "~/v3/db/schema";
import type { NewScore } from "~/v3/db/schema";

// submitWin(data): submits the win and calculates and returns your percentile scores

// getCategory(deckSize): returns list of scores matching deck size
// getAllScores(): returns all scores
//
const getAllScores = () => db.select().from(scores);

const getScoresByDeckSize = (deckSize: number) =>
  getAllScores().where(eq(scores.deckSize, deckSize));

const createScore = (data: NewScore) => db.insert(scores).values(data);

const dbService = {
  getAllScores,
  getScoresByDeckSize,
  createScore,
};

export default dbService;
