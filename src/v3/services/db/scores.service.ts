import {
  inArray,
} from "drizzle-orm";
import { SCORES_QUERY_PROPS_DEFAULT } from "./constants";
import type { ScoreQueryProps } from "./types";
import { scores } from "~/v3/db/schemas";
import type { InsertScore } from "~/v3/db/schemas/types";
import { getDB } from "~/v3/db";
import { buildOrderBy } from "./utils";


const getAllScores = () => getDB().select().from(scores);

const queryScores = async (opts: Partial<ScoreQueryProps>) => {
  opts = {...SCORES_QUERY_PROPS_DEFAULT, ...opts} as ScoreQueryProps;

  return getAllScores()
    // grab scores with deckSize in our array of deckSizes
    .where(inArray(scores.deckSize, opts.deckSizesFilter!))
    // sort using multiple sort column priorities
    .orderBy(...buildOrderBy(opts.sortByColumnHistory!, scores))
    .offset((opts.pageNumber! - 1) * opts.resultsPerPage!)
    .limit(opts.resultsPerPage!);
};

const createScore = async (newScore: InsertScore) => {
  if (!newScore.createdAt) newScore.createdAt = Date.now();
  return getDB()
    .insert(scores)
    .values(newScore)
    .returning()
    .then((scores) => scores[0]);
};

const clearScoresTable = () => getDB().delete(scores);

const scoreService = {
  create: createScore,
  getAll: getAllScores,
  query: queryScores,
  clear: clearScoresTable,
};
export default scoreService;
